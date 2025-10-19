const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
 meetingId: {
 type: String,
 required: true,
 unique: true,
 },
 title: {
 type: String,
 required: true,
 },
 createdBy: {
 type: String,
 required: true,
 },
 scheduledAt: {
 type: Date,
 },
 password: {
 type: String,
 },
 participantEmails: [{
 type: String,
 lowercase: true,
 trim: true,
 }],
 duration: {
 type: Number, // in minutes
 default: 60,
 },
 isActive: {
 type: Boolean,
 default: true,
 },
 participants: [{
 name: String,
 joinedAt: Date,
 }],
 lastParticipantLeftAt: {
 type: Date,
 default: null,
 },
 createdAt: {
 type: Date,
 default: Date.now,
 },
});

module.exports = mongoose.model('Meeting', meetingSchema);
