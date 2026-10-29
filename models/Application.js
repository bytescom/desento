import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        companyName: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            default: '',
        },
        hrName: {
            type: String,
            default: '',
        },
        hrEmail: {
            type: String,
            required: true,
        },
        emailLogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmailLog',
        },
        hrEmailId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrEmail',
        },
        gmailThreadId: {
            type: String,
        },
        lastEmailId: {
            type: String,
        },

        status: {
            type: String,
            enum: ['draft', 'sent', 'follow-up-sent', 'replied', 'interview', 'rejected', 'closed'],
            default: 'sent',
            index: true,
        },
        replyType: {
            type: String,
            enum: ['positive', 'negative', 'interview', 'neutral', null],
            default: null,
        },
        replyConfidence: {
            type: Number,
            default: null,
        },
        lastReplyPreview: {
            type: String,
            default: null,
        },
        followUpDate: {
            type: Date,
            default: null,
        },
        followUpCount: {
            type: Number,
            default: 0,
        },
        lastActionDate: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient dashboard queries
ApplicationSchema.index({ userId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ userId: 1, followUpDate: 1, status: 1 });
ApplicationSchema.index({ userId: 1, createdAt: -1 });
// Lookup used when recording a send to decide create-vs-follow-up
ApplicationSchema.index({ userId: 1, hrEmail: 1 });
ApplicationSchema.index({ gmailThreadId: 1 }, { sparse: true });

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
