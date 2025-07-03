import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Box, Typography, Alert, Modal, Paper, Button } from '@mui/material';
import * as THREE from 'three';

// --- Statcast-style MLB field constants ---
const BASE = 90;
const MOUND_DIST = 60.5;
const MOUND_DIAM = 18;
const MOUND_HEIGHT = 0.5;
const INFIELD_RADIUS = 95; // feet
const OUTFIELD_LF = 330;
const OUTFIELD_CF = 400;
const OUTFIELD_RF = 330;
const WARNING_TRACK_WIDTH = 15;
const WALL_HEIGHT = 10;
const FOUL_LINE_ANGLE = Math.PI / 4; // 45 deg
const FIELD_WIDTH = 250; // total width at outfield
const SCALE = 1; // 1 unit = 1 foot

// Helper: get base positions (feet)
function getBasePositions() {
  // Home, 1st, 2nd, 3rd (diamond) - home plate at front, bases extending forward
  const home = [0, 0, 0];
  const first = [BASE / Math.SQRT2, 0, -BASE / Math.SQRT2]; // 45° to the right
  const second = [0, 0, -BASE * Math.SQRT2]; // straight ahead
  const third = [-BASE / Math.SQRT2, 0, -BASE / Math.SQRT2]; // 45° to the left
  return { home, first, second, third };
}

// Helper: get outfield wall arc points (LF to RF)
function getOutfieldWallArc(steps = 100) {
  // Arc from 240° (LF, -45°) to 300° (RF, +45°)
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = -FOUL_LINE_ANGLE + t * (2 * FOUL_LINE_ANGLE); // -45° to +45°
    // Interpolate radius for CF
    let r = OUTFIELD_LF;
    if (Math.abs(angle) < 0.01) r = OUTFIELD_CF;
    if (angle < 0) r += (OUTFIELD_CF - OUTFIELD_LF) * (angle / -FOUL_LINE_ANGLE);
    if (angle > 0) r += (OUTFIELD_CF - OUTFIELD_RF) * (angle / FOUL_LINE_ANGLE);
    points.push([
      r * Math.sin(angle),
      0,
      -r * Math.cos(angle)
    ]);
  }
  return points;
}

// Helper: draw a pentagon for home plate
function HomePlate() {
  // MLB home plate: 17" wide, 8.5" deep, pentagon
  const w = 1.42, d = 0.71; // in feet
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w/2, 0);
    s.lineTo(w/2, 0);
    s.lineTo(w/2, -d);
    s.lineTo(0, -d*2);
    s.lineTo(-w/2, -d);
    s.lineTo(-w/2, 0);
    return s;
  }, []);
  return (
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#fff" />
    </mesh>
  );
}

// Helper: draw a base (white square)
function Base({ position }) {
  return (
    <mesh position={position} rotation={[-Math.PI/2, 0, 0]}>
      <boxGeometry args={[1.4, 1.4, 0.2]} />
      <meshStandardMaterial color="#fff" />
    </mesh>
  );
}

// Helper: draw the pitcher's mound
function PitchersMound() {
  return (
    <mesh position={[0, MOUND_HEIGHT, -MOUND_DIST]}>
      <cylinderGeometry args={[MOUND_DIAM/2, MOUND_DIAM/2, 1, 64]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  );
}

// Helper: draw the infield dirt diamond
function InfieldDirt() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[BASE * 2, BASE * 2]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
  );
}

// Helper: draw the outfield grass (simple plane)
function OutfieldGrass() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial color="#2E7D32" />
    </mesh>
  );
}

// Helper: draw foul territory (white areas outside foul lines)
function FoulTerritory() {
  const leftFoulShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(OUTFIELD_LF * Math.sin(-FOUL_LINE_ANGLE), -OUTFIELD_LF * Math.cos(-FOUL_LINE_ANGLE));
    s.lineTo(OUTFIELD_LF * Math.sin(-FOUL_LINE_ANGLE - 0.5), -OUTFIELD_LF * Math.cos(-FOUL_LINE_ANGLE - 0.5));
    s.lineTo(0, 0);
    return s;
  }, []);
  
  const rightFoulShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(OUTFIELD_RF * Math.sin(FOUL_LINE_ANGLE), -OUTFIELD_RF * Math.cos(FOUL_LINE_ANGLE));
    s.lineTo(OUTFIELD_RF * Math.sin(FOUL_LINE_ANGLE + 0.5), -OUTFIELD_RF * Math.cos(FOUL_LINE_ANGLE + 0.5));
    s.lineTo(0, 0);
    return s;
  }, []);
  
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <shapeGeometry args={[leftFoulShape]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <shapeGeometry args={[rightFoulShape]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}

// Helper: draw the warning track (arc just inside wall)
function WarningTrack() {
  const outer = getOutfieldWallArc(120);
  const inner = getOutfieldWallArc(120).map(([x, y, z]) => {
    const r = Math.sqrt(x*x + z*z) - WARNING_TRACK_WIDTH;
    const theta = Math.atan2(x, z);
    return [r * Math.sin(theta), 0, r * Math.cos(theta)];
  });
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    outer.forEach(([x, , z], i) => {
      if (i === 0) s.moveTo(x, z);
      else s.lineTo(x, z);
    });
    inner.reverse().forEach(([x, , z]) => s.lineTo(x, z));
    s.lineTo(outer[0][0], outer[0][2]);
    return s;
  }, [outer, inner]);
  return (
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI/2, 0, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#A1887F" />
    </mesh>
  );
}

// Helper: draw the outfield wall (solid continuous wall)
function OutfieldWall() {
  const arc = getOutfieldWallArc(120);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    arc.forEach(([x, , z], i) => {
      if (i === 0) s.moveTo(x, z);
      else s.lineTo(x, z);
    });
    return s;
  }, [arc]);
  
  return (
    <group>
      {/* Wall base */}
      <mesh position={[0, WALL_HEIGHT/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#1976D2" />
      </mesh>
      {/* Wall top */}
      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#1976D2" />
      </mesh>
      {/* Wall sides */}
      {arc.map(([x, , z], i) => {
        if (i === 0) return null;
        const [x0, , z0] = arc[i-1];
        const dx = x - x0, dz = z - z0;
        const len = Math.sqrt(dx*dx + dz*dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={i} position={[(x+x0)/2, WALL_HEIGHT/2, (z+z0)/2]} rotation={[0, angle, 0]}>
            <boxGeometry args={[len, WALL_HEIGHT, 1]} />
            <meshStandardMaterial color="#1976D2" />
          </mesh>
        );
      })}
    </group>
  );
}

// Helper: draw a solid fence around the field
function FieldFence() {
  const arc = getOutfieldWallArc(120);
  return (
    <group>
      {arc.map(([x, , z], i) => {
        if (i === 0) return null;
        const [x0, , z0] = arc[i-1];
        const dx = x - x0, dz = z - z0;
        const len = Math.sqrt(dx*dx + dz*dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={i} position={[(x+x0)/2, 1, (z+z0)/2]} rotation={[0, angle, 0]}>
            <boxGeometry args={[len, 2, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
        );
      })}
    </group>
  );
}

// Helper: draw distance markers on wall
function WallMarkers() {
  const markers = [
    { text: '330', angle: -FOUL_LINE_ANGLE, r: OUTFIELD_LF },
    { text: '400', angle: 0, r: OUTFIELD_CF },
    { text: '330', angle: FOUL_LINE_ANGLE, r: OUTFIELD_RF },
  ];
  return markers.map(({ text, angle, r }, i) => (
    <Text
      key={i}
      position={[r * Math.sin(angle), WALL_HEIGHT + 1, -r * Math.cos(angle)]}
      fontSize={8}
      color="#FFFFFF"
      anchorX="center"
      anchorY="middle"
      outlineColor="#1976D2"
      outlineWidth={1}
    >
      {text}
    </Text>
  ));
}

// Helper: draw foul lines
function FoulLines() {
  const left = [OUTFIELD_LF * Math.sin(-FOUL_LINE_ANGLE), 0, -OUTFIELD_LF * Math.cos(-FOUL_LINE_ANGLE)];
  const right = [OUTFIELD_RF * Math.sin(FOUL_LINE_ANGLE), 0, -OUTFIELD_RF * Math.cos(FOUL_LINE_ANGLE)];
  return (
    <group>
      {/* Left foul line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0,0,0, ...left])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#FFFFFF" linewidth={2} />
      </line>
      {/* Right foul line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0,0,0, ...right])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#FFFFFF" linewidth={2} />
      </line>
    </group>
  );
}

// Helper: draw base paths (white lines between bases)
function BasePaths() {
  const { home, first, second, third } = getBasePositions();
  const lines = [
    [home, first],
    [first, second],
    [second, third],
    [third, home],
  ];
  return (
    <group>
      {lines.map(([a, b], i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...a, ...b])} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color="#FFFFFF" linewidth={2} />
        </line>
      ))}
    </group>
  );
}

// Helper: draw batter's boxes
function BattersBoxes() {
  // Two rectangles, 4ft x 6ft, 6" from plate, 3ft wide
  const y = 0.02;
  return (
    <group>
      <mesh position={[-3, y, -3.5]} rotation={[-Math.PI/2, 0, 0]}>
        <boxGeometry args={[4, 6, 0.1]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[3, y, -3.5]} rotation={[-Math.PI/2, 0, 0]}>
        <boxGeometry args={[4, 6, 0.1]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
    </group>
  );
}

// Main Statcast-style field
function StatcastField() {
  const { home, first, second, third } = getBasePositions();
  return (
    <group>
      <OutfieldGrass />
      <InfieldDirt />
      <WarningTrack />
      <PitchersMound />
      <BattersBoxes />
      <HomePlate />
      <Base position={first} />
      <Base position={second} />
      <Base position={third} />
      <BasePaths />
      <FoulLines />
      <OutfieldWall />
      <FieldFence />
      <WallMarkers />
    </group>
  );
}

// Trajectory arc calculation for ball flight paths
function calculateTrajectory(start, end, launchAngle, exitVelocity) {
  try {
    const points = [];
    const baseHeight = Math.max(15, Math.min(60, (launchAngle || 25) * 1.5));
    const velocityFactor = Math.min(1.2, Math.max(0.8, (exitVelocity || 90) / 100));
    const maxHeight = baseHeight * velocityFactor;
    
    for (let t = 0; t <= 1; t += 0.005) { // More points for smoother curves
      const x = start[0] + (end[0] - start[0]) * t;
      const z = start[2] + (end[2] - start[2]) * t;
      // Smoother parabolic arc with realistic height based on launch angle and exit velocity
      const y = 4 * maxHeight * t * (1 - t) * (1 - 0.15 * t);
      points.push([x, y, z]);
    }
    return points;
  } catch (error) {
    console.error('Error calculating trajectory:', error);
    // Fallback: simple straight line
    return [start, end];
  }
}

function TrajectoryArc({ start, end, launchAngle, exitVelocity, selected, onPointerOver, onPointerOut, onClick }) {
  const points = useMemo(() => calculateTrajectory(start, end, launchAngle, exitVelocity), [start, end, launchAngle, exitVelocity]);
  const lineWidth = selected ? 4 : 2;
  
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1976D2" linewidth={lineWidth} transparent opacity={0.8} />
      </line>
    </group>
  );
}

// Interactive ball landing spot component
function LandingSpot({ swing, position, onHover, onLeave, onClick, isHovered }) {
  const color = isHovered ? '#42A5F5' : '#1976D2';
  const size = isHovered ? 2.5 : 2;
  
  return (
    <group>
      <mesh 
        position={position} 
        onPointerOver={onHover}
        onPointerOut={onLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// Basic tooltip component
function BasicTooltip({ swing, position }) {
  return (
    <Html position={position}>
      <Box 
        sx={{ 
          bgcolor: '#fff', 
          color: '#1c2c4d', 
          p: 1.5, 
          borderRadius: 2, 
          border: '2px solid #1976D2', 
          fontSize: 12, 
          minWidth: 120, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap'
        }}
      >
        <div><b>LA:</b> {swing.launch_angle}°</div>
        <div><b>EV:</b> {swing.exit_velocity} mph</div>
        <div><b>Distance:</b> {swing.distance} ft</div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
          Click for details
        </div>
      </Box>
    </Html>
  );
}

// Detailed swing information modal
function SwingDetailsModal({ swing, open, onClose }) {
  if (!swing) return null;
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="swing-details-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper 
        sx={{ 
          p: 3, 
          maxWidth: 400, 
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="#1c2c4d" mb={2}>
          Swing {swing.swing_number || swing.id}
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Exit Velocity:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.exit_velocity} mph</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Launch Angle:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.launch_angle}°</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Distance:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.distance} ft</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Horizontal Angle:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.horiz_angle}°</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Spray Chart X:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.spray_chart_x}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#666">Spray Chart Z:</Typography>
            <Typography variant="body2" fontWeight="bold">{swing.spray_chart_z}</Typography>
          </Box>
          
          {swing.id && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="#666">Swing ID:</Typography>
              <Typography variant="body2" fontWeight="bold">{swing.id}</Typography>
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={onClose}
            sx={{ 
              bgcolor: '#1976D2',
              '&:hover': { bgcolor: '#1565C0' }
            }}
          >
            Close
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}

// Stable camera component to prevent shaking
function StableCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Set initial camera position and lock it
    camera.position.set(0, 25, 50);
    camera.lookAt(0, 0, -200);
    camera.fov = 48;
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
}

const SprayChart3D = ({ swings = [], selectedIdx, onSelect, width = 800, height = 500 }) => {
  const [hoveredSwing, setHoveredSwing] = useState(null);
  const [selectedSwing, setSelectedSwing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Memoize the display swings to prevent unnecessary re-renders
  const displaySwings = useMemo(() => {
    return swings.length > 0 ? swings : [
      { id: 'test1', exit_velocity: 105, launch_angle: 25, spray_chart_x: -50, spray_chart_z: 300, distance: 350, horiz_angle: -15 },
      { id: 'test2', exit_velocity: 95, launch_angle: 18, spray_chart_x: 30, spray_chart_z: 280, distance: 320, horiz_angle: 10 },
      { id: 'test3', exit_velocity: 110, launch_angle: 30, spray_chart_x: 0, spray_chart_z: 400, distance: 420, horiz_angle: 0 }
    ];
  }, [swings]);

  const handleLandingSpotHover = useCallback((swing) => {
    setHoveredSwing(swing);
  }, []);

  const handleLandingSpotLeave = useCallback(() => {
    setHoveredSwing(null);
  }, []);

  const handleLandingSpotClick = useCallback((swing) => {
    setSelectedSwing(swing);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedSwing(null);
  }, []);

  return (
    <Box sx={{ width: '100%', bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4, p: 2, boxShadow: '0 4px 16px rgba(28,44,77,0.08)', position: 'relative' }}>
      <Typography variant="h6" fontWeight={700} color="#1c2c4d" mb={2}>3D Spray Chart Visualization</Typography>
      {swings.length === 0 && (
        <Alert severity="info" sx={{ mb: 2, bgcolor: '#e3f2fd', color: '#1c2c4d', border: '1px solid #3a7bd5' }}>
          Showing sample data for demonstration. Upload Hittrax data to see real trajectories.
        </Alert>
      )}
      <Canvas 
        camera={{ position: [0, 25, 50], fov: 48, up: [0, 1, 0] }} 
        style={{ width, height, background: '#FAFAFA', borderRadius: 8 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <StableCamera />
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 200, 200]} intensity={0.9} />
        <directionalLight position={[-100, 100, -100]} intensity={0.5} />
        <StatcastField />
        {displaySwings.map((swing, idx) => {
          const end = [Number(swing.spray_chart_x || 0), 0, -Number(swing.spray_chart_z || 0)];
          return (
            <group key={swing.id || idx}>
              <TrajectoryArc
                start={[0, 0, 0]}
                end={end}
                launchAngle={swing.launch_angle}
                exitVelocity={swing.exit_velocity}
                selected={selectedIdx === idx}
                onPointerOver={() => {}}
                onPointerOut={() => {}}
                onClick={() => onSelect && onSelect(idx)}
              />
              <LandingSpot
                swing={swing}
                position={end}
                onHover={() => handleLandingSpotHover(swing)}
                onLeave={handleLandingSpotLeave}
                onClick={() => handleLandingSpotClick(swing)}
                isHovered={hoveredSwing === swing}
              />
            </group>
          );
        })}
        {hoveredSwing && (
          <BasicTooltip 
            swing={hoveredSwing} 
            position={[Number(hoveredSwing.spray_chart_x || 0), 0, -Number(hoveredSwing.spray_chart_z || 0)]} 
          />
        )}
      </Canvas>
      <SwingDetailsModal 
        swing={selectedSwing} 
        open={modalOpen} 
        onClose={handleCloseModal} 
      />
    </Box>
  );
};

export default SprayChart3D; 