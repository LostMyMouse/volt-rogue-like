# Voice direction and character identity

Volt is a young adult man and uses he/him pronouns. His identity appears in his notebook and in the character and art briefs.

His voice is an original youthful American male tenor with warm chest resonance, quick comic timing, nervous charm and bursts of brave confidence. Keep the delivery conversational and energetic. This is an original performance direction, not a celebrity voice clone.

## Recording

- Voice design: `eleven_ttv_v3` through `/v1/text-to-voice/design`.
- Speech: `eleven_v4`, with stability 0.5 and similarity 0.8.
- Casting: the `volt` entry in `tools/audio/designed.json` overrides the fallback cast.
- Direction: `tools/audio/design.py`; line-specific emotion cues: `PERFORMANCE_TAGS` in `tools/audio/gen.py`.
- No pitch shifting or playback-speed change is applied to Volt in the game.

Set `ELEVENLABS_API_KEY` in your shell environment, then run from the repository root:

```sh
python tools/audio/gen.py voice --only=volt --force
```

This replaces Volt's existing recordings, including combat barks. Without `--force`, existing files are skipped. Each successful response replaces its file atomically. All 13 speaking characters now use Eleven v4: 157 distinct lines, including combat barks, tutorial instructions and villain memory taunts. Casting remains consistent across the game. Echo's opening line is now "Oh, I like him."

To design a fresh voice and save three audition clips under ignored `voice-audition/`:

```sh
python tools/audio/design.py volt
```

This creates and selects the first take. To choose another take, put the zero-based selection in `tools/audio/picks.json` before designing. Review the previews before spending credits to regenerate the full script. API keys belong in environment variables or the ignored `tools/audio/.key`, never in committed files or browser JavaScript.

## Redactor and Gravemark

Redactor uses his existing custom casting with Eleven v4, restrained delivery and precise personal threats. The direction is cultured, controlled and unnervingly polite. His broadcast has a light filter; his close voice retains human clarity. The account's custom voice slots were full, so no existing voice was deleted to create a replacement. His rewritten broadcast and every encounter branch are recorded, as are his persistent defeat-memory taunts.

Gravemark also uses Eleven v4. His normal-paced words carry a deep stone sub-layer, bass resonance and a shorter cavern reverb. Neither Web Audio nor the file fallback slows his playback. Size comes from resonance, not stretched speech.

New tutorial advice explains the full parry rewards and Composure breaks, voiced by Bastion with Eleven v4. New villain memory taunts use Eleven v4 with each villain's existing casting.

## Full cast release verification

`tools/audio/cast-v4-manifest.json` records the model, casting and SHA-256 for every active recording. `cast-v4-qa.json` records transcription and timing checks for all 157 lines. Number spelling, punctuation, intentional interruptions and explicit pronunciation aliases account for the remaining comparison flags. The unclear Kilnheart taunt was regenerated and passed transcription.
