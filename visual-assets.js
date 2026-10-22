// Replace an entry with a local image path when original artwork is ready.
// Six transparent PNG/WebP portraits; recommended source size 512 × 640.
// An absent or failed image keeps the built-in baseball illustration.
window.DiamondVisualAssets={portraits:['./assets/portraits/avatar-01.webp','./assets/portraits/avatar-02.webp','./assets/portraits/avatar-03.webp','./assets/portraits/avatar-04.webp','./assets/portraits/avatar-05.webp','./assets/portraits/avatar-06.webp'],milestones:['./assets/journey/journey-01.webp','./assets/journey/journey-02.webp','./assets/journey/journey-03.webp','./assets/journey/journey-04.webp','./assets/journey/journey-05.webp']};
// Five optional landscape milestone scenes; recommended size 1600 × 900.

// V2.8: original identity-preserving three-pose atlases (swing, windup, seated rest).
window.DiamondVisualAssets.actions=Array.from({length:6},(_,i)=>'./assets/actions/avatar-0'+(i+1)+'.png');
