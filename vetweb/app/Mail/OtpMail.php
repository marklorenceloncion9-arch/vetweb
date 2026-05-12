<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $purpose;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $purpose = 'password_reset')
    {
        $this->otp = $otp;
        $this->purpose = $purpose;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match($this->purpose) {
            'password_reset' => 'Password Reset OTP - Vetcare',
            'account_claim' => 'Account Setup OTP - Vetcare',
            default => 'Your OTP Code - Vetcare',
        };

        return new Envelope(
            from: config('mail.from.address'),
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $purposeText = match($this->purpose) {
            'password_reset' => 'reset your password',
            'account_claim' => 'set up your walk-in account',
            default => 'verify your identity',
        };

        return new Content(
            htmlString: $this->getHtmlContent($purposeText),
        );
    }

    /**
     * Build email HTML content
     */
    private function getHtmlContent(string $purposeText): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo-text { color: #7c3aed; font-size: 24px; font-weight: bold; }
        .otp-box { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; }
        .message { color: #666; line-height: 1.6; text-align: center; }
        .expiry { color: #ef4444; font-size: 14px; text-align: center; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <div class="logo-text">Vetcare</div>
        </div>
        
        <p class="message">You requested to <strong>{$purposeText}</strong>. Use the OTP code below:</p>
        
        <div class="otp-box">
            <div class="otp-code">{$this->otp}</div>
        </div>
        
        <p class="expiry">This code expires in 10 minutes.</p>
        
        <p class="message">If you didn't request this, please ignore this email.</p>
        
        <div class="footer">
            <p>Vetcare Mobile App</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
