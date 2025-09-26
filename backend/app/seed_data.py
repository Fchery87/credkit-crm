"""
Seed data for CredKit CRM development and demo purposes
"""
from app.database import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.organization import Organization
from app.models.client import Client
from app.models.task import Task, TaskPriority, TaskStatus
from app.services.letter_templates_seed import seed_system_templates
from app.models.dispute import Dispute, DisputeStatus
from app.models.stage import Stage
from app.models.tag import Tag
from app.models.audit_log import AuditLog
from passlib.context import CryptContext
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _hash_password(password: str) -> str:
    return pwd_context.hash(password)



def create_seed_data():
    """Create sample data for development and demo"""
    db = SessionLocal()
    
    try:
        # Check if seed data already exists
        existing_tenant = db.query(Tenant).filter(Tenant.name == "Demo Credit Repair Co").first()
        if existing_tenant:
            print("Seed data already exists. Skipping...")
            return
        
        print("Creating seed data...")
        
        # 1. Create Demo Tenant
        demo_tenant = Tenant(name="Demo Credit Repair Co")
        db.add(demo_tenant)
        db.commit()
        db.refresh(demo_tenant)
        
        # 2. Create Demo Organization
        demo_org = Organization(name="Demo Credit Repair Co")
        db.add(demo_org)
        db.commit()
        db.refresh(demo_org)
        
        # 3. Create Demo Users
        admin_user = User(
            email="admin@demo.com",
            hashed_password=_hash_password("admin123"),
            first_name="Admin",
            last_name="User",
            role="admin",
            tenant_id=demo_tenant.id,
            organization_id=demo_org.id,
            is_active=True
        )
        
        manager_user = User(
            email="manager@demo.com",
            hashed_password=_hash_password("manager123"),
            first_name="Manager",
            last_name="Smith",
            role="manager",
            tenant_id=demo_tenant.id,
            organization_id=demo_org.id,
            is_active=True
        )
        
        agent_user = User(
            email="agent@demo.com",
            hashed_password=_hash_password("agent123"),
            first_name="Agent",
            last_name="Johnson",
            role="user",
            tenant_id=demo_tenant.id,
            organization_id=demo_org.id,
            is_active=True
        )
        
        db.add_all([admin_user, manager_user, agent_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(manager_user)
        db.refresh(agent_user)

        # Seed system letter templates
        seed_system_templates(db, demo_tenant.id)

        # 4. Create Pipeline Stages
        stages = [
            Stage(name="Lead", description="Initial contact", order=1, color="#3B82F6", tenant_id=demo_tenant.id),
            Stage(name="Prospect", description="Qualified lead", order=2, color="#10B981", tenant_id=demo_tenant.id),
            Stage(name="Client", description="Active client", order=3, color="#F59E0B", tenant_id=demo_tenant.id),
            Stage(name="Completed", description="Service completed", order=4, color="#8B5CF6", tenant_id=demo_tenant.id)
        ]
        
        db.add_all(stages)
        db.commit()
        
        # 5. Create Tags
        tags = [
            Tag(name="High Priority", color="#EF4444", tenant_id=demo_tenant.id),
            Tag(name="VIP Client", color="#8B5CF6", tenant_id=demo_tenant.id),
            Tag(name="Payment Issue", color="#F97316", tenant_id=demo_tenant.id),
            Tag(name="Follow Up", color="#06B6D4", tenant_id=demo_tenant.id),
            Tag(name="New Client", color="#10B981", tenant_id=demo_tenant.id)
        ]
        
        db.add_all(tags)
        db.commit()
        
        # 6. Create Sample Clients
        clients = [
            Client(
                first_name="John",
                last_name="Doe",
                email="john.doe@email.com",
                phone="+1-555-0101",
                tenant_id=demo_tenant.id,
                stage_id=stages[2].id  # Client stage
            ),
            Client(
                first_name="Jane",
                last_name="Smith",
                email="jane.smith@email.com",
                phone="+1-555-0102",
                tenant_id=demo_tenant.id,
                stage_id=stages[1].id  # Prospect stage
            ),
            Client(
                first_name="Michael",
                last_name="Johnson",
                email="michael.j@email.com",
                phone="+1-555-0103",
                tenant_id=demo_tenant.id,
                stage_id=stages[0].id  # Lead stage
            ),
            Client(
                first_name="Sarah",
                last_name="Williams",
                email="sarah.w@email.com",
                phone="+1-555-0104",
                tenant_id=demo_tenant.id,
                stage_id=stages[2].id  # Client stage
            ),
            Client(
                first_name="David",
                last_name="Brown",
                email="david.brown@email.com",
                phone="+1-555-0105",
                tenant_id=demo_tenant.id,
                stage_id=stages[3].id  # Completed stage
            )
        ]
        
        db.add_all(clients)
        db.commit()
        
        # 7. Create Sample Tasks
        tasks = [
            Task(
                title="Review credit report for John Doe",
                description="Analyze credit report and identify disputable items",
                priority=TaskPriority.HIGH,
                status=TaskStatus.IN_PROGRESS,
                due_date=datetime.now().date() + timedelta(days=2),
                tenant_id=demo_tenant.id,
                client_id=clients[0].id,
                assigned_to=agent_user.id,
                created_by=manager_user.id
            ),
            Task(
                title="Prepare dispute letters for Jane Smith",
                description="Draft dispute letters for 3 negative accounts",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.TODO,
                due_date=datetime.now().date() + timedelta(days=5),
                tenant_id=demo_tenant.id,
                client_id=clients[1].id,
                assigned_to=agent_user.id,
                created_by=manager_user.id
            ),
            Task(
                title="Follow up with Michael Johnson",
                description="Call client to discuss credit repair strategy",
                priority=TaskPriority.HIGH,
                status=TaskStatus.TODO,
                due_date=datetime.now().date() + timedelta(days=1),
                tenant_id=demo_tenant.id,
                client_id=clients[2].id,
                assigned_to=manager_user.id,
                created_by=admin_user.id
            ),
            Task(
                title="Send welcome package to Sarah Williams",
                description="Email welcome materials and next steps",
                priority=TaskPriority.LOW,
                status=TaskStatus.COMPLETED,
                due_date=datetime.now().date() - timedelta(days=1),
                tenant_id=demo_tenant.id,
                client_id=clients[3].id,
                assigned_to=agent_user.id,
                created_by=manager_user.id
            )
        ]
        
        db.add_all(tasks)
        db.commit()
        
        # 8. Create Sample Disputes
        disputes = [
            Dispute(
                title="Dispute late payment - Capital One",
                status=DisputeStatus.SENT,
                tenant_id=demo_tenant.id,
                client_id=clients[0].id
            ),
            Dispute(
                title="Remove collection account - ABC Collections",
                status=DisputeStatus.QUEUED,
                tenant_id=demo_tenant.id,
                client_id=clients[0].id
            ),
            Dispute(
                title="Dispute credit inquiry - Experian",
                status=DisputeStatus.RESOLVED,
                tenant_id=demo_tenant.id,
                client_id=clients[3].id
            ),
            Dispute(
                title="Challenge account balance - Chase Bank",
                status=DisputeStatus.DRAFT,
                tenant_id=demo_tenant.id,
                client_id=clients[1].id
            )
        ]
        
        db.add_all(disputes)
        db.commit()
        
        print("[seed] Seed data created successfully!")
        print("\n[seed] Demo Login Credentials:")
        print("Admin: admin@demo.com / admin123")
        print("Manager: manager@demo.com / manager123")
        print("Agent: agent@demo.com / agent123")
        print("\n[seed] Sample Data Created:")
        print(f"- {len(clients)} sample clients")
        print(f"- {len(tasks)} sample tasks")
        print(f"- {len(disputes)} sample disputes")
        print(f"- {len(stages)} pipeline stages")
        print(f"- {len(tags)} client tags")
        
    except Exception as e:
        print(f"[seed] Error creating seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def clear_seed_data():
    """Clear all seed data (for development)"""
    db = SessionLocal()
    
    try:
        print("Clearing seed data...")
        
        # Delete in reverse order of dependencies
        demo_tenant = db.query(Tenant).filter(Tenant.name == "Demo Credit Repair Co").first()
        if demo_tenant:
            # Delete all related data
            db.query(Task).filter(Task.tenant_id == demo_tenant.id).delete()
            db.query(Dispute).filter(Dispute.tenant_id == demo_tenant.id).delete()
            db.query(Client).filter(Client.tenant_id == demo_tenant.id).delete()
            db.query(Stage).filter(Stage.tenant_id == demo_tenant.id).delete()
            db.query(Tag).filter(Tag.tenant_id == demo_tenant.id).delete()
            db.query(User).filter(User.tenant_id == demo_tenant.id).delete()
            db.delete(demo_tenant)
            
            # Delete demo organization
            demo_org = db.query(Organization).filter(Organization.name == "Demo Credit Repair Co").first()
            if demo_org:
                db.delete(demo_org)
            
            db.commit()
            print("[seed] Seed data cleared successfully!")
        else:
            print("No seed data found to clear.")
            
    except Exception as e:
        print(f"[seed] Error clearing seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "clear":
        clear_seed_data()
    else:
        create_seed_data()









