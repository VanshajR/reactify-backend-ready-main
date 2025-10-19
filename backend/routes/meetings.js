const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { v4: uuidv4 } = require('uuid');


router.post('/', async (req, res) => {
 try {
 const { title, createdBy, scheduledAt, password } = req.body;
 
 const meeting = new Meeting({
 meetingId: uuidv4(),
 title,
 createdBy,
 scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
 password,
 });

 await meeting.save();
 res.status(201).json(meeting);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});


router.get('/user/:userName', async (req, res) => {
 try {
 const { userName } = req.params;
 const meetings = await Meeting.find({ 
 createdBy: userName,
 isActive: true,
 }).sort({ createdAt: -1 });
 
 res.json(meetings);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});


router.get('/:meetingId', async (req, res) => {
 try {
 const { meetingId } = req.params;
 const meeting = await Meeting.findOne({ meetingId });
 
 if (!meeting) {
 return res.status(404).json({ error: 'Meeting not found' });
 }
 
 res.json(meeting);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});


router.post('/:meetingId/verify', async (req, res) => {
 try {
 const { meetingId } = req.params;
 const { password } = req.body;
 
 const meeting = await Meeting.findOne({ meetingId });
 
 if (!meeting) {
 return res.status(404).json({ error: 'Meeting not found' });
 }
 
 if (meeting.password && meeting.password !== password) {
 return res.status(401).json({ error: 'Invalid password' });
 }
 
 res.json({ valid: true });
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});


router.post('/:meetingId/participants', async (req, res) => {
 try {
 const { meetingId } = req.params;
 const { name } = req.body;
 
 const meeting = await Meeting.findOne({ meetingId });
 
 if (!meeting) {
 return res.status(404).json({ error: 'Meeting not found' });
 }
 
 meeting.participants.push({
 name,
 joinedAt: new Date(),
 });
 
 await meeting.save();
 res.json(meeting);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});


router.delete('/:meetingId', async (req, res) => {
 try {
 const { meetingId } = req.params;
 await Meeting.findOneAndUpdate(
 { meetingId },
 { isActive: false }
 );
 
 res.json({ message: 'Meeting deleted successfully' });
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});

module.exports = router;
