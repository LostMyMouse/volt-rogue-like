# Volt's voice and identity

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

This replaces Volt's existing recordings, including combat barks. Without `--force`, existing files are skipped. Each successful response replaces its file atomically. The other characters keep their existing recordings and models. Echo's opening line is now "Oh, I like him."

To design a fresh voice and save three audition clips under ignored `voice-audition/`:

```sh
python tools/audio/design.py volt
```

This creates and selects the first take. To choose another take, put the zero-based selection in `tools/audio/picks.json` before designing. Review the previews before spending credits to regenerate the full script. API keys belong in environment variables or the ignored `tools/audio/.key`, never in committed files or browser JavaScript.
