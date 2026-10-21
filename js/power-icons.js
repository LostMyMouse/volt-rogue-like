'use strict';
// Native ink emblems: weapon silhouette plus the supplying hero's insignia.
function powerEmblem(weapon,hero){
 const shapes={brawler:'M20 53V32l7-3 5 5V23l7-2 4 6 6-2 5 5 6-1 4 6-1 21-13 13H33Z',caster:'M25 63l7-26 10 5 9-27 10 3-4 25-12 4-6 22Z',titan:'M18 42l9-8 13 3 10-8 13 7 4 18-18 12-25-6Z',speedster:'M18 57l20-15-5-12 14-5 20 16-6 10-18-4-11 17Z',magnetar:'M42 18a24 24 0 1 0 1 0Zm0 13a11 11 0 1 1-1 0Z'};
 const insignia={halo:'M70 8l4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z',bastion:'M58 10l13-4 13 4v14L71 36 58 24Z',echo:'M56 21Q70 3 85 21Q70 39 56 21Zm14-7a7 7 0 1 0 1 0Z',thorn:'M59 32Q55 8 82 8Q85 30 59 32Zm0 0 19-20'};
 const c=HEROES[hero]?.c||COL.heal;
 return `<svg class="power-emblem" aria-hidden="true" viewBox="0 0 96 84"><defs><pattern id="dots-${weapon}-${hero}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${c}" opacity=".25"/></pattern></defs><path d="M4 10 82 2 93 71 14 82Z" fill="#142238" stroke="#04070e" stroke-width="5"/><path d="M7 13 80 6 89 69 16 78Z" fill="url(#dots-${weapon}-${hero})"/><path d="${shapes[weapon]||shapes.brawler}" fill="${c}" fill-rule="evenodd" stroke="#04070e" stroke-width="3" stroke-linejoin="round"/><path d="${insignia[hero]||insignia.bastion}" fill="#fff1d0" fill-rule="evenodd" stroke="#04070e" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
