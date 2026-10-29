import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Draft', 'Running', 'Scheduled', 'Completed', 'Failed'],
        default: 'Draft',
    },
    senderEmail: {
        type: String,
        default: '',
    },
    // Reference to the EmailTemplate used
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
        default: null,
    },
    templateSnapshot: {
        // Snapshot at time of creation so edits don't break sent campaigns
        name: String,
        subject: String,
        body: String,
    },
    // Array of HrEmail _ids selected as audience
    audienceIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HrEmail',
    }],
    // Leads already attempted by the batched send loop — lets /send resume
    // where it stopped instead of restarting (or worse, re-sending) after a
    // timeout or a follow-up batch request.
    sentLeadIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HrEmail',
    }],
    // Campaign attachments — small files stored base64-inline (cap ~4 MB total
    // enforced by the API) and attached to every email in the campaign.
    attachments: [{
        name: String,
        size: String,
        contentType: String,
        data: String, // base64 (no data: prefix)
    }],
    // Progress tracking
    totalRecipients: {
        type: Number,
        default: 0,
    },
    sentCount: {
        type: Number,
        default: 0,
    },
    // Settings
    trackOpens: { type: Boolean, default: true },
    trackReplies: { type: Boolean, default: true },
    stopAfterReply: { type: Boolean, default: true },

    // Timestamps
    launchedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save (async pattern — Mongoose 7+ compatible)
CampaignSchema.pre('save', async function () {
    this.updatedAt = new Date();
});

CampaignSchema.index({ userId: 1, createdAt: -1 });

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
export default Campaign;
