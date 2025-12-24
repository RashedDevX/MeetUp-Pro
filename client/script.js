const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };

// র‍্যান্ডম ইউজার আইডি জেনারেট করা হচ্ছে
const userId = Math.floor(Math.random() * 1000000);

const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');

hostBtn.onclick = () => startMeeting('host');
joinBtn.onclick = () => startMeeting('audience');

async function startMeeting(role) {
    const roomId = document.getElementById('room-id').value;
    if (!roomId) return alert("Please enter a room name!");

    try {
        // Render ব্যাকএন্ডে টোকেনের জন্য রিকোয়েস্ট পাঠানো হচ্ছে
        const response = await fetch('https://meetup-pro.onrender.com/api/get-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                roomId: roomId, 
                userId: userId.toString() 
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Agora SDK দিয়ে রুমে জয়েন করা
        await client.join(data.appId, roomId, data.token, userId);

        // UI পরিবর্তন করা
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('video-grid').style.display = 'grid';
        document.getElementById('controls').style.display = 'flex';

        // অডিও এবং ভিডিও ট্র্যাক তৈরি
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        // নিজের ভিডিও প্লে করা
        localTracks.videoTrack.play('local-player');
        
        // ট্র্যাকগুলো পাবলিশ করা যেন অন্যরা দেখতে পায়
        await client.publish(Object.values(localTracks));

        // অন্য ইউজার জয়েন করলে তা হ্যান্ডেল করা
        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

    } catch (e) {
        console.error("Error details:", e);
        alert("Connection failed! Please ensure the backend is live and check console for errors.");
    }
}

async function handleUserJoined(user, mediaType) {
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
        let player = document.createElement('div');
        player.id = `user-${user.uid}`;
        player.className = 'video-wrapper';
        player.innerHTML = `
            <div id="agora-user-${user.uid}" style="width:100%; height:100%;"></div>
            <div class="label">User: ${user.uid}</div>
        `;
        document.getElementById('video-grid').appendChild(player);
        user.videoTrack.play(`agora-user-${user.uid}`);
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

function handleUserLeft(user) {
    const player = document.getElementById(`user-${user.uid}`);
    if (player) player.remove();
}

// লিভ বাটন ক্লিক করলে পেজ রিলোড হবে
document.getElementById('leave-btn').onclick = () => window.location.reload();

// লিঙ্ক কপি করার ফাংশন
document.getElementById('copy-btn').onclick = () => {
    const roomId = document.getElementById('room-id').value;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied to clipboard!");
};

// URL এ রুম আইডি থাকলে তা অটোমেটিক ইনপুট বক্সে বসানো
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) document.getElementById('room-id').value = roomParam;
};