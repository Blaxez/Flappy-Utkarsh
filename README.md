<div align="center">
  <img src="assets/images/utkarsh.png" alt="Flappy Utkarsh Logo" width="200"/>
  
  # Flappy Utkarsh
  
  A modern, feature-rich Flappy Bird clone featuring Utkarsh with beautiful graphics, smooth animations, and professional game mechanics.
</div>

## Features

- **Dynamic Character States**: Normal, jump, and cry animations
- **Smooth Death Animation**: Realistic fall with emotional feedback
- **Collision Debug Mode**: Press 'I' to toggle hitbox visualization
- **Realistic Grass**: Animated grass with wind effects
- **Sound Effects**: Flap, coin collection, and game over sounds
- **Background Music**: Looping ambient music
- **Difficulty Levels**: Easy, Normal, and Hard modes
- **Score Tracking**: Session and all-time high scores
- **Responsive Design**: Works on all screen sizes
- **Modern UI**: Glassmorphic menus with smooth animations

## Project Structure

```
flappy-utkarsh/
├── assets/
│   ├── audio/                # All sound effects and music
│   │   ├── background_music.mp3
│   │   ├── coin_sound.mp3
│   │   ├── flap.mp3
│   │   └── game_over.mp3
│   └── images/               # All sprites & backgrounds
│       ├── city_background.png
│       ├── utkarsh.png
│       ├── utkarsh-jump.png
│       └── utkarsh-cry.png
├── js/
│   └── game.js               # Main game logic
├── index.html                # Entry point
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
└── README.md                 # Complete documentation
```

## How to Play

1. **Start**: Click "Start Game" or press Space
2. **Flap**: Click, tap, or press Space to make the bird fly
3. **Avoid**: Don't hit pipes or the ground
4. **Collect**: Grab coins for bonus points
5. **Debug**: Press 'I' to toggle collision hitboxes

## Controls

- **Space / Click / Tap**: Flap wings
- **Escape**: Pause game
- **I**: Toggle debug mode

## Technical Stack

- **HTML5 Canvas**: For rendering
- **Vanilla JavaScript**: No frameworks
- **CSS3**: Modern glassmorphic UI
- **Web Audio API**: Sound management

## Game Mechanics

### Scoring
- **Pipe Pass**: 1 point per pipe
- **Coin Collection**: 10 points per coin
- **High Scores**: Session and all-time tracking

### Physics
- Gravity-based falling
- Velocity-based rotation
- Smooth collision detection
- Aspect ratio preservation

### Visual Effects
- Dynamic character states
- Death animation with cry sprite
- Tumbling rotation on collision
- Animated grass with wind
- Parallax scrolling background

## Configuration

Edit difficulty settings in `js/game.js`:

```javascript
const DIFFICULTY_SETTINGS = {
  easy: { gravity: 0.3, pipeSpeed: 2, gap: 250 },
  normal: { gravity: 0.4, pipeSpeed: 3, gap: 200 },
  hard: { gravity: 0.5, pipeSpeed: 4, gap: 180 }
};
```

## License

MIT License - See LICENSE file for details

## Author

Created by Blaxez

## Acknowledgments

- Original Flappy Bird by Dong Nguyen
- Modern UI design inspired by glassmorphism trends
- Sound effects and music from various sources

---

**Enjoy playing as Utkarsh!**