const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let remoteUsers = {};
const userId = Math.floor(Math.random() * 1000000);

// Buttons
const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');

hostBtn.onclick = () => startMeeting('host');
joinBtn.onclick = () => startMeeting('audience');

async function startMeeting(role) {
    const roomId = document.getElementById('room-id').value;
    if (!roomId) return alert("Please enter a room name!");

    try {
        // Fetch Token from your Node.js Backend
        const response = await fetch('http://localhost:5000/api/get-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, userId: userId.toString(), role })
        });
        
        const data = await response.json();

        // Join Channel
        await client.join(data.appId, roomId, data.token, userId);

        // UI Transition
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('video-grid').style.display = 'grid';
        document.getElementById('controls').style.display = 'flex';

        // Create and Play Tracks
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play('local-player');
        
        // Publish to others
        await client.publish(Object.values(localTracks));

        // Listen for remote users
        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

    } catch (e) {
        console.error(e);
        alert("Server is not responding. Make sure backend is running on port 5000.");
    }
}

async function handleUserJoined(user, mediaType) {
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
        let player = document.createElement('div');
        player.id = `user-${user.uid}`;
        player.className = 'video-wrapper';
        player.innerHTML = `<div id="agora-user-${user.uid}" style="width:100%; height:100%;"></div><div class="label">User: ${user.uid}</div>`;
        document.getElementById('video-grid').appendChild(player);
        user.videoTrack.play(`agora-user-${user.uid}`);
    }
    if (mediaType === 'audio') user.audioTrack.play();
}

function handleUserLeft(user) {
    document.getElementById(`user-${user.uid}`)?.remove();
}

// Leave meeting logic
document.getElementById('leave-btn').onclick = () => window.location.reload();

// ইনভাইট লিঙ্ক কপি করার ফাংশন
document.getElementById('copy-btn').onclick = () => {
    const roomId = document.getElementById('room-id').value;
    // আপনার সাইটের ইউআরএল এর সাথে রুম আইডি যোগ করা
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied to clipboard! Share it with your client.");
};

// অটোমেটিক রুম আইডি ইনপুট নেওয়া (যদি লিঙ্ক থেকে আসে)
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('room-id').value = roomParam;
        // সে চাইলে সরাসরি Join বাটনে ক্লিক করতে পারবে
    }
};
