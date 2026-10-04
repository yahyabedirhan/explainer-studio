import { Series, useVideoConfig } from "remotion";
import { sceneFrames } from "../../lib/timing";
import { Hook } from "./scenes/Hook";
import { TheMac } from "./scenes/TheMac";
import { TheMachines } from "./scenes/TheMachines";
import { TheRule } from "./scenes/TheRule";
import { TwoFiles } from "./scenes/TwoFiles";
import { PingOrNotice } from "./scenes/PingOrNotice";
import { NoticeOnMac } from "./scenes/NoticeOnMac";
import { NoticePoll } from "./scenes/NoticePoll";
import { Tailscale } from "./scenes/Tailscale";
import { NoticeTailnet } from "./scenes/NoticeTailnet";
import { NotesInNotion } from "./scenes/NotesInNotion";
import { NoteWritten } from "./scenes/NoteWritten";
import { NoteRead } from "./scenes/NoteRead";
import { TheMap } from "./scenes/TheMap";
import { Outro } from "./scenes/Outro";
import voiceover from "./voiceover.json";

export const ShipyardArchitecture: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence
        name="Hook"
        durationInFrames={sceneFrames(voiceover, "hook", fps)}
        premountFor={fps}
      >
        <Hook />
      </Series.Sequence>
      <Series.Sequence
        name="TheMac"
        durationInFrames={sceneFrames(voiceover, "the-mac", fps)}
        premountFor={fps}
      >
        <TheMac />
      </Series.Sequence>
      <Series.Sequence
        name="TheMachines"
        durationInFrames={sceneFrames(voiceover, "the-machines", fps)}
        premountFor={fps}
      >
        <TheMachines />
      </Series.Sequence>
      <Series.Sequence
        name="TheRule"
        durationInFrames={sceneFrames(voiceover, "the-rule", fps)}
        premountFor={fps}
      >
        <TheRule />
      </Series.Sequence>
      <Series.Sequence
        name="TwoFiles"
        durationInFrames={sceneFrames(voiceover, "two-files", fps)}
        premountFor={fps}
      >
        <TwoFiles />
      </Series.Sequence>
      <Series.Sequence
        name="PingOrNotice"
        durationInFrames={sceneFrames(voiceover, "ping-or-notice", fps)}
        premountFor={fps}
      >
        <PingOrNotice />
      </Series.Sequence>
      <Series.Sequence
        name="NoticeOnMac"
        durationInFrames={sceneFrames(voiceover, "notice-on-mac", fps)}
        premountFor={fps}
      >
        <NoticeOnMac />
      </Series.Sequence>
      <Series.Sequence
        name="NoticePoll"
        durationInFrames={sceneFrames(voiceover, "notice-poll", fps)}
        premountFor={fps}
      >
        <NoticePoll />
      </Series.Sequence>
      <Series.Sequence
        name="Tailscale"
        durationInFrames={sceneFrames(voiceover, "tailscale", fps)}
        premountFor={fps}
      >
        <Tailscale />
      </Series.Sequence>
      <Series.Sequence
        name="NoticeTailnet"
        durationInFrames={sceneFrames(voiceover, "notice-tailnet", fps)}
        premountFor={fps}
      >
        <NoticeTailnet />
      </Series.Sequence>
      <Series.Sequence
        name="NotesInNotion"
        durationInFrames={sceneFrames(voiceover, "notes-in-notion", fps)}
        premountFor={fps}
      >
        <NotesInNotion />
      </Series.Sequence>
      <Series.Sequence
        name="NoteWritten"
        durationInFrames={sceneFrames(voiceover, "note-written", fps)}
        premountFor={fps}
      >
        <NoteWritten />
      </Series.Sequence>
      <Series.Sequence
        name="NoteRead"
        durationInFrames={sceneFrames(voiceover, "note-read", fps)}
        premountFor={fps}
      >
        <NoteRead />
      </Series.Sequence>
      <Series.Sequence
        name="TheMap"
        durationInFrames={sceneFrames(voiceover, "the-map", fps)}
        premountFor={fps}
      >
        <TheMap />
      </Series.Sequence>
      <Series.Sequence
        name="Outro"
        durationInFrames={sceneFrames(voiceover, "outro", fps)}
        premountFor={fps}
      >
        <Outro />
      </Series.Sequence>
    </Series>
  );
};
