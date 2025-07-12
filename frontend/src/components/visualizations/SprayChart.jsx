import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

// Field dimensions (in feet, for scaling)
const FIELD_WIDTH = 330 * 2; // 330ft left to 330ft right
const FIELD_HEIGHT = 420;    // 420ft to center
const PADDING = 32;

function scaleX(x) {
  // x: -330 (left) to +330 (right)
  return ((x + 330) / 660) * (FIELD_WIDTH - 2 * PADDING) + PADDING;
}
function scaleY(z) {
  // z: 0 (home plate) to 420 (center field)
  return (FIELD_HEIGHT - PADDING) - (z / 420) * (FIELD_HEIGHT - 2 * PADDING);
}

const SprayChart = ({ swings = [], width = 660, height = 420 }) => {
  const [hovered, setHovered] = useState(null);

  // Memoize points for performance
  const points = useMemo(() => {
    // Ensure swings is always an array
    const safeSwings = Array.isArray(swings) ? swings : [];
    
    return safeSwings.map((swing, i) => ({
      x: scaleX(Number(swing.spray_chart_x || 0)),
      y: scaleY(Number(swing.spray_chart_z || 0)),
      ev: swing.exit_velocity,
      la: swing.launch_angle,
      idx: i,
      ...swing
    }));
  }, [swings]);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4, p: 2, boxShadow: '0 4px 16px rgba(28,44,77,0.08)' }}>
      <Typography variant="h6" fontWeight={700} color="#1c2c4d" mb={2}>
        Spray Chart Visualization
      </Typography>
      <Box sx={{ width: width, height: height, position: 'relative', bgcolor: '#fff' }}>
        <svg width={width} height={height} style={{ display: 'block', background: '#fff', borderRadius: 8 }}>
          {/* Draw field outline (arc for outfield, lines for foul lines) */}
          <path
            d={`M${scaleX(0)},${scaleY(0)}
              L${scaleX(-330)},${scaleY(330)}
              A330,330 0 0,1 ${scaleX(330)},${scaleY(330)}
              Z`}
            fill="#e3f2fd"
            stroke="#3a7bd5"
            strokeWidth={2}
          />
          {/* Foul lines */}
          <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(-330)} y2={scaleY(330)} stroke="#3a7bd5" strokeWidth={1.5} />
          <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(330)} y2={scaleY(330)} stroke="#3a7bd5" strokeWidth={1.5} />
          {/* Home plate */}
          <circle cx={scaleX(0)} cy={scaleY(0)} r={7} fill="#1c2c4d" />
          {/* Plot swings */}
          {(Array.isArray(points) ? points : []).map((pt) => (
            <Tooltip
              key={pt.idx}
              title={`EV: ${pt.ev} MPH\nLA: ${pt.la}°`}
              arrow
              placement="top"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={7}
                fill={hovered === pt.idx ? '#ff9800' : '#3a7bd5'}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                onMouseEnter={() => setHovered(pt.idx)}
                onMouseLeave={() => setHovered(null)}
              />
            </Tooltip>
          ))}
        </svg>
      </Box>
    </Box>
  );
};

export default SprayChart; 