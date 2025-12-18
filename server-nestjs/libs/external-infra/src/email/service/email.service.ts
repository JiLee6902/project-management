import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.senderEmail = this.configService.get<string>('GMAIL_USER', '');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.senderEmail,
        pass: this.configService.get<string>('GMAIL_APP_PASS', ''),
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Project Management" <${this.senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendTaskAssignmentEmail(params: {
    to: string;
    userName: string;
    taskId?: string;
    taskTitle: string;
    taskDescription?: string;
    projectName: string;
    dueDate?: Date;
    origin?: string;
  }): Promise<void> {
    const viewTaskLink = params.origin && params.taskId
      ? `${params.origin}/tasks/${params.taskId}`
      : null;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hi ${params.userName},</p>
            <p>You have been assigned a new task in <strong>${params.projectName}</strong>.</p>

            <div class="task-info">
              <h3>${params.taskTitle}</h3>
              ${params.taskDescription ? `<p>${params.taskDescription}</p>` : ''}
              ${params.dueDate ? `<p><strong>Due Date:</strong> ${new Date(params.dueDate).toLocaleDateString()}</p>` : ''}
            </div>

            ${viewTaskLink ? `<p style="text-align: center; margin-top: 20px;"><a href="${viewTaskLink}" class="btn">View Task</a></p>` : '<p>Please log in to view the task details and start working on it.</p>'}
          </div>
          <div class="footer">
            <p>This is an automated message from Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: params.to,
      subject: `New Task: ${params.taskTitle} - ${params.projectName}`,
      html,
    });
  }

  async sendTaskReminderEmail(params: {
    to: string;
    userName: string;
    taskTitle: string;
    projectName: string;
    dueDate: Date;
  }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #EF4444; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Due Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${params.userName},</p>
            <p>This is a reminder that your task is due today!</p>

            <div class="task-info">
              <h3>${params.taskTitle}</h3>
              <p><strong>Project:</strong> ${params.projectName}</p>
              <p><strong>Due Date:</strong> ${new Date(params.dueDate).toLocaleDateString()}</p>
            </div>

            <p>Please make sure to complete this task on time.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: params.to,
      subject: `Reminder: ${params.taskTitle} is due today!`,
      html,
    });
  }
}
