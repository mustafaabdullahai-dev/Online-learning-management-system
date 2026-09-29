// src/MeetingRoom.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const MeetingRoom = () => {
    const { roomId } = useParams(); // Gets the meeting ID from the URL

    const myMeeting = async (element) => {
        // --- REPLACE THESE WITH YOUR ACTUAL KEYS FROM ZEGOCLOUD CONSOLE ---
        const appID = 123456789; 
        const serverSecret = "YOUR_ACTUAL_SERVER_SECRET_HERE"; 
        
        // Generate a token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, 
            serverSecret, 
            roomId, 
            Date.now().toString(), // Random user ID unique to this session
            "Student" // You can replace this with a real name from localStorage later
        );

        // Create the instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);

        // Join the room
        zp.joinRoom({
            container: element,
            sharedLinks: [
                {
                    name: 'Copy Link',
                    url: window.location.protocol + '//' + window.location.host + window.location.pathname + '?roomID=' + roomId,
                },
            ],
            scenario: {
                mode: ZegoUIKitPrebuilt.VideoConference,
            },
        });
    };

    return (
        <div
            className="myCallContainer"
            ref={myMeeting}
            style={{ width: '100vw', height: '100vh' }}
        ></div>
    );
};

export default MeetingRoom;