# Complete Testing Checklist

## Setup
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:8080
- [ ] Chrome browser for Admin
- [ ] Firefox browser for Guest

## Test 1: Meeting Creation & Admission
1. [ ] **Chrome**: Create meeting with camera ON
2. [ ] **Chrome**: See own video feed
3. [ ] **Firefox**: Join meeting
4. [ ] **Firefox**: See "Waiting for Host" screen
5. [ ] **Chrome**: See join request notification (toast + badge on Admin Panel button)
6. [ ] **Chrome**: Click Admin Panel → See guest in waiting list
7. [ ] **Chrome**: Click "Admit" button
8. [ ] **Firefox**: See "Admitted" toast and enter meeting

## Test 2: Video Feeds
9. [ ] **Chrome**: See own video + guest's video (if guest has camera on)
10. [ ] **Firefox**: See own video + admin's video
11. [ ] **Both**: Videos should be live and synchronized

## Test 3: Camera Toggle
12. [ ] **Chrome**: Turn camera OFF → **Firefox** should see "Camera Off" for admin
13. [ ] **Chrome**: Turn camera ON → **Firefox** should see admin's video again
14. [ ] **Firefox**: Turn camera OFF → **Chrome** should see "Camera Off" for guest
15. [ ] **Firefox**: Turn camera ON → **Chrome** should see guest's video again

## Test 4: Audio Toggle
16. [ ] **Chrome**: Mute mic → **Firefox** should see muted icon on admin's video
17. [ ] **Chrome**: Unmute mic → **Firefox** icon should disappear
18. [ ] **Firefox**: Mute mic → **Chrome** should see muted icon on guest's video
19. [ ] **Firefox**: Unmute mic → **Chrome** icon should disappear

## Test 5: Chat
20. [ ] **Chrome**: Open chat panel
21. [ ] **Chrome**: Send message "Hello from Admin"
22. [ ] **Firefox**: Open chat panel → Should see admin's message
23. [ ] **Firefox**: Send message "Hello from Guest"
24. [ ] **Chrome**: Should see guest's message
25. [ ] **Both**: Send multiple messages back and forth

## Test 6: User Leaving
26. [ ] **Firefox**: Click "Leave" button
27. [ ] **Chrome**: Should see toast "User Left - [Guest Name] left the meeting"
28. [ ] **Chrome**: Guest's video tile should disappear
29. [ ] **Chrome**: Participants count should update

## Test 7: Screen Share
30. [ ] **Chrome**: Click screen share button
31. [ ] **Chrome**: Select window/screen to share
32. [ ] **Firefox**: Should see admin's screen share (NOT their camera)
33. [ ] **Chrome**: Stop screen share
34. [ ] **Firefox**: Should see admin's camera again

## Test 8: Admin Permissions
35. [ ] **Chrome**: Open Admin Panel
36. [ ] **Chrome**: Toggle "Allow Video" OFF for guest
37. [ ] **Firefox**: Camera button should be disabled
38. [ ] **Chrome**: Toggle "Allow Video" ON for guest
39. [ ] **Firefox**: Camera button should be enabled again
40. [ ] Repeat for Audio and Screen Share permissions

## Test 9: Kick User
41. [ ] **Chrome**: In Admin Panel, click "Kick" on guest
42. [ ] **Firefox**: Should be kicked from meeting and redirected to home
43. [ ] **Firefox**: Should see "Kicked from Meeting" toast

## Test 10: Recording (if implemented)
44. [ ] **Chrome**: Start recording
45. [ ] **Both**: Should see "Recording Started" notification
46. [ ] **Chrome**: Stop recording
47. [ ] **Both**: Should see "Recording Stopped" notification
48. [ ] **Chrome**: Check if recording was saved

---

## Known Issues to Watch For:
- ⚠️ Same-system testing may have WebRTC quirks (use different devices ideally)
- ⚠️ Incognito mode shares some resources with main browser
- ⚠️ If video doesn't show, check console for ICE connection state
- ⚠️ If chat doesn't sync, verify both users are in Socket.IO room (backend logs)

## Success Criteria:
- ✅ All video feeds visible and live
- ✅ All toggles sync between users
- ✅ Chat works bidirectionally
- ✅ User leaving updates in real-time
- ✅ No console errors
- ✅ All notifications appear with sounds
