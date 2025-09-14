import os
from typing import Optional, Dict, Any
from twilio.rest import Client as TwilioClient
from postmark import PMMail
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.postmark_token = os.getenv('POSTMARK_SERVER_TOKEN')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@credkit.com')
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        template_id: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send email via Postmark"""
        try:
            if not self.postmark_token:
                logger.warning("Postmark token not configured")
                return False
                
            # Create email using PMMail
            email = PMMail(
                api_key=self.postmark_token,
                subject=subject,
                sender=self.from_email,
                to=to_email,
                html_body=html_body,
                text_body=text_body or ""
            )
            
            # Send email
            response = email.send()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_welcome_email(self, to_email: str, user_name: str, tenant_name: str):
        """Send welcome email to new users"""
        subject = f"Welcome to {tenant_name} - CredKit CRM"
        html_body = f"""
        <h2>Welcome to CredKit CRM, {user_name}!</h2>
        <p>Your account has been created successfully for <strong>{tenant_name}</strong>.</p>
        <p>You can now access your dashboard and start managing your credit repair operations.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The CredKit Team</p>
        """
        
        return await self.send_email(to_email, subject, html_body)
    
    async def send_task_notification(self, to_email: str, task_title: str, due_date: str):
        """Send task assignment notification"""
        subject = f"New Task Assigned: {task_title}"
        html_body = f"""
        <h2>New Task Assigned</h2>
        <p>You have been assigned a new task: <strong>{task_title}</strong></p>
        <p>Due Date: {due_date}</p>
        <p>Please log in to your CredKit CRM dashboard to view details and take action.</p>
        """
        
        return await self.send_email(to_email, subject, html_body)


class SMSService:
    def __init__(self):
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_FROM_NUMBER')
        
        if account_sid and auth_token:
            self.client = TwilioClient(account_sid, auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")
    
    async def send_sms(self, to_number: str, message: str) -> bool:
        """Send SMS via Twilio"""
        if not self.client:
            logger.error("Twilio client not configured")
            return False
        
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully to {to_number}, SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_number}: {str(e)}")
            return False
    
    async def send_task_reminder(self, to_number: str, task_title: str):
        """Send task reminder SMS"""
        message = f"CredKit CRM Reminder: Task '{task_title}' is due soon. Please check your dashboard."
        return await self.send_sms(to_number, message)
    
    async def send_dispute_update(self, to_number: str, dispute_title: str, status: str):
        """Send dispute status update SMS"""
        message = f"CredKit CRM Update: Dispute '{dispute_title}' status changed to {status}."
        return await self.send_sms(to_number, message)


class NotificationService:
    def __init__(self):
        self.email_service = EmailService()
        self.sms_service = SMSService()
    
    async def send_notification(
        self,
        user_email: str,
        user_phone: Optional[str],
        notification_type: str,
        subject: str,
        message: str,
        email_template_id: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None,
        send_email: bool = True,
        send_sms: bool = False
    ) -> Dict[str, bool]:
        """Send notification via multiple channels"""
        results = {}
        
        if send_email:
            if email_template_id and template_data:
                results['email'] = await self.email_service.send_email(
                    to_email=user_email,
                    subject=subject,
                    html_body="",  # Will be ignored for templated emails
                    template_id=email_template_id,
                    template_data=template_data
                )
            else:
                results['email'] = await self.email_service.send_email(
                    to_email=user_email,
                    subject=subject,
                    html_body=f"<p>{message}</p>"
                )
        
        if send_sms and user_phone:
            results['sms'] = await self.sms_service.send_sms(user_phone, message)
        
        return results
    
    async def notify_task_assigned(
        self,
        assignee_email: str,
        assignee_phone: Optional[str],
        task_title: str,
        due_date: str,
        send_sms: bool = False
    ):
        """Notify user about task assignment"""
        return await self.send_notification(
            user_email=assignee_email,
            user_phone=assignee_phone,
            notification_type="task_assigned",
            subject=f"New Task Assigned: {task_title}",
            message=f"You have been assigned a new task: {task_title}. Due: {due_date}",
            send_email=True,
            send_sms=send_sms
        )
    
    async def notify_dispute_status_change(
        self,
        client_email: str,
        client_phone: Optional[str],
        dispute_title: str,
        new_status: str,
        send_sms: bool = False
    ):
        """Notify client about dispute status change"""
        return await self.send_notification(
            user_email=client_email,
            user_phone=client_phone,
            notification_type="dispute_update",
            subject=f"Dispute Update: {dispute_title}",
            message=f"Your dispute '{dispute_title}' status has been updated to: {new_status}",
            send_email=True,
            send_sms=send_sms
        )


# Global notification service instance
notification_service = NotificationService()