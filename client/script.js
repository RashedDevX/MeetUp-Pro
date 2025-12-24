const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
// Agora এর জন্য userId অবশ্যই নাম্বার হতে হবে
const userId = Math.floor(Math.random() * 1000000);

const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');

hostBtn.onclick = () => startMeeting('host');
joinBtn.onclick = () => startMeeting('audience');

async function startMeeting(role) {
    const roomId = document.getElementById('room-id').value;
    if (!roomId) return alert("Please enter a room name!");

    try {
        // Render ব্যাকএন্ডে রিকোয়েস্ট পাঠানো হচ্ছে
        const response = await fetch('https://meetup-pro.onrender.com/api/get-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                roomId: roomId, 
                userId: userId.toString() 
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Agora ক্লায়েন্টে জয়েন করা
        await client.join(data.appId, roomId, data.token, userId);

        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('video-grid').style.display = 'grid';
        document.getElementById('controls').style.display = 'flex';

        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play('local-player');
        await client.publish(Object.values(localTracks));

        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

    } catch (e) {
        console.error("Detailed Error:", e);
        alert("Connection failed! Make sure the backend is awake and CORS is allowed.");
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
    const player = document.getElementById(`user-${user.uid}`);
    if (player) player.remove();
}

document.getElementById('leave-btn').onclick = () => window.location.reload();