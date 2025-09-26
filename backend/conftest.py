import os
import sys
from pathlib import Path
import types

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / 'app'
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

os.environ.setdefault('DATABASE_URL', 'sqlite:///./test_app.db')
os.environ.setdefault('REDIS_URL', 'redis://localhost:6379')

# Stub external services to avoid optional dependencies during tests

class _DummyS3Client:
    def put_object(self, **kwargs):
        return {'ETag': '"dummy"'}

    def generate_presigned_url(self, method, Params=None, ExpiresIn=None):
        key = Params.get('Key') if Params else 'object'
        return f'https://example.com/{key}'

    def delete_object(self, **kwargs):
        return None

    def head_object(self, **kwargs):
        return {
            'ContentLength': 0,
            'ContentType': 'application/octet-stream',
            'LastModified': None,
            'ETag': '"dummy"',
            'Metadata': {}
        }

    def list_objects_v2(self, **kwargs):
        return {}

if 'boto3' not in sys.modules:
    stub = types.ModuleType('boto3')
    stub.client = lambda *args, **kwargs: _DummyS3Client()
    sys.modules['boto3'] = stub

if 'botocore' not in sys.modules:
    sys.modules['botocore'] = types.ModuleType('botocore')

if 'botocore.exceptions' not in sys.modules:
    exc_mod = types.ModuleType('botocore.exceptions')
    class ClientError(Exception):
        pass
    exc_mod.ClientError = ClientError
    sys.modules['botocore.exceptions'] = exc_mod

if 'twilio' not in sys.modules:
    sys.modules['twilio'] = types.ModuleType('twilio')

if 'twilio.rest' not in sys.modules:
    rest_mod = types.ModuleType('twilio.rest')
    class _DummyMessages:
        def create(self, **kwargs):
            class _Result:
                sid = 'dummy-sid'
            return _Result()
    class Client:
        def __init__(self, *args, **kwargs):
            self.messages = _DummyMessages()
    rest_mod.Client = Client
    sys.modules['twilio.rest'] = rest_mod

if 'postmark' not in sys.modules:
    postmark_mod = types.ModuleType('postmark')
    class PMMail:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
        def send(self):
            return True
    postmark_mod.PMMail = PMMail
    sys.modules['postmark'] = postmark_mod

if 'docusign_esign' not in sys.modules:
    docusign_mod = types.ModuleType('docusign_esign')
    sys.modules['docusign_esign'] = docusign_mod
    # minimal classes to satisfy imports
    class _ApiClient:
        def __init__(self):
            self.host = ''
        def request_jwt_user_token(self, **kwargs):
            class _Token:
                access_token = 'dummy'
            return _Token()
        def set_default_header(self, *args, **kwargs):
            pass
    class _EnvelopesApi:
        def __init__(self, client):
            pass
        def create_envelope(self, **kwargs):
            class _Result:
                envelope_id = 'dummy'
                status = 'sent'
                status_date_time = ''
                uri = ''
            return _Result()
        def get_envelope(self, **kwargs):
            class _Envelope:
                envelope_id = 'dummy'
                status = 'sent'
                status_date_time = ''
                completed_date_time = ''
                sent_date_time = ''
            return _Envelope()
        def get_document(self, **kwargs):
            return b''
    docusign_mod.ApiClient = _ApiClient
    docusign_mod.EnvelopesApi = _EnvelopesApi
    docusign_mod.EnvelopeDefinition = object
    docusign_mod.Document = object
    docusign_mod.Signer = object
    docusign_mod.SignHere = object
    docusign_mod.Tabs = object
    docusign_mod.Recipients = object

from sqlalchemy.dialects import sqlite
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String as _String

from sqlalchemy.ext.compiler import compiles
from sqlalchemy import String as _String

from app.config import settings

settings.DATABASE_URL = os.environ['DATABASE_URL']
settings.REDIS_URL = os.environ['REDIS_URL']


@compiles(PG_UUID, 'sqlite')
def compile_uuid(element, compiler, **kw):
    return 'CHAR(36)'

if 'stripe' not in sys.modules:
    stripe_mod = types.ModuleType('stripe')

    class _Customer:
        @staticmethod
        def create(**kwargs):
            return type('Customer', (), {'id': 'cus_dummy'})

    class _CheckoutSession:
        @staticmethod
        def create(**kwargs):
            return type('Session', (), {'url': 'https://example.com/checkout', 'id': 'sess_dummy'})

    class _Subscription:
        @staticmethod
        def delete(*args, **kwargs):
            return None

    class _Webhook:
        @staticmethod
        def construct_event(payload, sig_header, endpoint_secret):
            return {'type': 'noop', 'data': {'object': {}}}

    stripe_mod.Customer = _Customer
    stripe_mod.checkout = type('checkout', (), {'Session': _CheckoutSession})
    stripe_mod.Subscription = _Subscription
    stripe_mod.Webhook = _Webhook
    sys.modules['stripe'] = stripe_mod
