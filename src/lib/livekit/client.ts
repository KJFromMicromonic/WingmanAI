import {
    Room, RoomEvent, Track, LocalAudioTrack, RemoteTrackPublication, RemoteParticipant
} from 'livekit-client';

export class VoiceRoleplayManager {
    private room: Room | null = null;
    private onAIResponseCallback: ((text:string)=> void) | null = null;
    private onUserSpeakingCallback: ((isSpeaking:boolean)=> void)|null = null;
    private onConnectionStateChangedCallback: ((state:string)=> void)|null = null;

    constructor() {
        this.initializeRoom();
    }
    
}