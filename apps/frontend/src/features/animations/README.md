# Animation System

This directory contains the animation system for the portfolio website. The system supports multiple animations running in parallel with individual controls.

## Structure

```
animations/
├── components/
│   ├── index.ts              # Exports all animation components
│   ├── AnimationManager.tsx  # Manages multiple animations
│   ├── SVGLineAnimation.tsx  # SVG line drawing animation
│   └── BubblingAnimation.tsx # Bubble floating animation
└── README.md                 # This documentation
```

## Components

### AnimationManager
The main component that coordinates multiple animations running in parallel.

**Features:**
- Individual toggle controls for each animation
- Centralized animation state management
- Development mode with debug information
- Performance monitoring

**Usage:**
```typescript
<AnimationManager 
  isActive={true}
  devMode={false}
/>
```

### SVGLineAnimation
Creates a smooth SVG line drawing animation using path commands.

**Features:**
- Smooth S-curve path using elliptical arcs
- Gradient stroke animation
- Development mode to show complete path
- Responsive design

**Usage:**
```typescript
<SVGLineAnimation 
  isActive={true}
  devMode={false}
/>
```

### BubblingAnimation
Creates floating bubble effects using SVG circles and CSS transforms.

**Features:**
- Multiple bubbles with independent cycles
- CSS transforms for smooth performance
- Randomized sizes, speeds, and movements
- Configurable parameters

**Usage:**
```typescript
<BubblingAnimation 
  isActive={true}
  bubbleCount={12}
  maxSize={80}
  minSize={25}
  durationRange={[10, 18]}
  opacityRange={[0.08, 0.35]}
/>
```

## Controls

The animation system provides several control options:

1. **Global Toggle** (⏸️/▶️): Controls all animations at once
2. **Individual Toggles** (📈/🫧): Control each animation separately
3. **Dev Mode** (🔧/🐛): Shows debug information and animation status

## Adding New Animations

To add a new animation:

1. Create a new component in `components/`
2. Add it to the `AnimationManager` configurations
3. Add individual toggle controls
4. Update the exports in `index.ts`

## Performance Considerations

- All animations use CSS transforms for optimal performance
- SVG elements are optimized for smooth rendering
- Animation parameters can be adjusted for different performance targets
- Performance monitoring is built into the system

## Development

The animation system includes development features:
- Debug information in dev mode
- Animation status indicators
- Performance warnings
- Visual debugging tools 