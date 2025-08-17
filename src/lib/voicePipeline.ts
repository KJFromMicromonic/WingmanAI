// lib/voicePipeline.ts
import { Room, RoomEvent, LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';

class VoiceRoleplayManager {
  private room: Room;
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.speechClient = new SpeechClient();
    this.ttsClient = new TextToSpeechClient();
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async joinVoiceRoom(roomId: string, userId: string) {
    this.room = new Room();
    
    await this.room.connect(
      process.env.LIVEKIT_URL!,
      await this.getToken(roomId, userId)
    );

    this.setupEventListeners();
    return this.room;
  }

  private setupEventListeners() {
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteAudioTrack) => {
      if (track.kind === 'audio') {
        // Handle incoming audio from AI
        this.handleAIResponse(track);
      }
    });

    this.room.localParticipant.on('trackPublished', (track: LocalAudioTrack) => {
      if (track.kind === 'audio') {
        // Handle user audio input
        this.handleUserAudio(track);
      }
    });
  }

  private async handleUserAudio(track: LocalAudioTrack) {
    // Stream audio to Google STT
    const stream = await track.getMediaStream();
    const recognitionStream = this.speechClient.streamingRecognize({
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
      interimResults: false,
    });

    // Process audio chunks
    stream.getAudioTracks()[0].onended = async () => {
      const transcript = await this.getTranscript(recognitionStream);
      const aiResponse = await this.getAIResponse(transcript);
      await this.speakResponse(aiResponse);
    };
  }

  private async getAIResponse(userInput: string): Promise<string> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash-lit' });
    const result = await model.generateContent(userInput);
    return result.response.text();
  }

  private async speakResponse(text: string) {
    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    // Play audio through LiveKit
    const audioBlob = new Blob([response.audioContent!], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Send to LiveKit room
    const audioElement = new Audio(audioUrl);
    audioElement.play();
  }
}