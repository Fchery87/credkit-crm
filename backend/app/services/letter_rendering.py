from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict

import markdown
from jinja2 import Environment, StrictUndefined, TemplateError
from weasyprint import HTML


_DEF_BASE_STYLE = """
body{font-family:Helvetica,Arial,sans-serif;line-height:1.6;margin:2rem;}
h1,h2,h3,h4{color:#111;margin-top:1.5rem;}
table{border-collapse:collapse;width:100%;margin:1rem 0;}
th,td{border:1px solid #ccc;padding:0.5rem;text-align:left;}
ul,ol{padding-left:1.5rem;}
code{background-color:#f4f4f4;padding:0.2rem 0.4rem;border-radius:4px;}
"""


def _build_environment() -> Environment:
    env = Environment(autoescape=False, undefined=StrictUndefined)
    env.globals.setdefault("now", lambda: datetime.now(timezone.utc))
    return env


@dataclass
class LetterRenderResult:
    markdown: str
    html: str
    pdf_bytes: bytes
    pdf_base64: str


class LetterRenderer:
    """Renders markdown templates into HTML and PDF."""

    def __init__(self) -> None:
        self.env = _build_environment()

    def render(self, *, template: str, context: Dict[str, Any]) -> LetterRenderResult:
        enriched_context = {
            **context,
            "current_date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        }

        try:
            markdown_body = self.env.from_string(template).render(enriched_context)
        except TemplateError as exc:
            raise ValueError(f"Failed to render template: {exc}") from exc

        html_body = markdown.markdown(markdown_body, extensions=["extra", "toc"])
        full_html = (
            "<html><head><meta charset=\"utf-8\"><style>"
            + _DEF_BASE_STYLE
            + "</style></head><body>"
            + html_body
            + "</body></html>"
        )

        pdf_bytes = HTML(string=full_html).write_pdf()
        encoded = base64.b64encode(pdf_bytes).decode("ascii")

        return LetterRenderResult(
            markdown=markdown_body,
            html=full_html,
            pdf_bytes=pdf_bytes,
            pdf_base64=encoded,
        )


def render_letter(*, template: str, context: Dict[str, Any]) -> LetterRenderResult:
    renderer = LetterRenderer()
    return renderer.render(template=template, context=context)

