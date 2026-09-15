import React from 'react';
import { Composition } from 'remotion';
import { formats, fps, type FormatName } from './brand';
import { OrderStory, orderStoryDuration } from './compositions/OrderStory';
import { LaunchFilm, launchFilmDuration } from './compositions/LaunchFilm';

/**
 * One story, registered once per shape.
 *
 * The component is the same in all three; only the frame size and the type scale
 * change. That is the whole reason this is code rather than a video editor: a
 * wording change is one edit, and the three cuts stay in step with it and with
 * each other. Re-cutting the same story by hand in three aspect ratios is the
 * job nobody does twice, which is why most small businesses post one 16:9 clip
 * letterboxed into a phone.
 */
export function RemotionRoot() {
  const cuts: FormatName[] = ['vertical', 'square', 'wide'];
  return (
    <>
      {cuts.map((format) => (
        <Composition
          key={format}
          id={`order-story-${format}`}
          component={OrderStory}
          durationInFrames={orderStoryDuration}
          fps={fps}
          width={formats[format].width}
          height={formats[format].height}
          defaultProps={{ format, art: false }}
        />
      ))}
      {/* The same story on generated backdrops. Registered only for vertical,
          because that is the cut worth spending generation on first and a second
          set of three would be six near-identical entries in the studio. Run
          `node scripts/generate.mjs` before rendering this one. */}
      <Composition
        id="order-story-vertical-art"
        component={OrderStory}
        durationInFrames={orderStoryDuration}
        fps={fps}
        width={formats.vertical.width}
        height={formats.vertical.height}
        defaultProps={{ format: 'vertical' as FormatName, art: true }}
      />
      {/* The launch film, in all three shapes. It runs about fifty seconds,
          which is long for a feed and right for a launch: this is the one people
          are sent, not the one they scroll past. */}
      {cuts.map((format) => (
        <Composition
          key={`launch-${format}`}
          id={`launch-film-${format}`}
          component={LaunchFilm}
          durationInFrames={launchFilmDuration}
          fps={fps}
          width={formats[format].width}
          height={formats[format].height}
          defaultProps={{ format }}
        />
      ))}
    </>
  );
}
