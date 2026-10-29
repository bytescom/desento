import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        index: true,
    },
    hrEmailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HrEmail',
    },
    recipient: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'pending', 'queued'],
        default: 'queued',
    },
    errorMessage: {
        type: String,
    },
    gmailMessageId: {
        type: String,
    },
    gmailThreadId: {
        type: String,
    },
    sentAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
EmailLogSchema.index({ userId: 1, createdAt: -1 });
EmailLogSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);
