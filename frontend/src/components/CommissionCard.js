import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip,
  Divider,
  Button,
  LinearProgress,
  CardActionArea,
} from '@mui/material';
import { format } from 'date-fns';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';

const progressSteps = {
  'Sketching': 20,
  'Lineart': 40,
  'Coloring': 60,
  'Shading': 80,
  'Rendering': 100
};

const complexityColors = {
  'Low': '#4CAF50', // Green
  'Mid': '#FFC107', // Amber
  'High': '#FF9800', // Orange
  'Ultra High': '#F44336', // Red
  'Sistine Chapel': '#9C27B0' // Purple
};

const CommissionCard = ({ commission, highlighted = false, onLoginClick }) => {
  const { isAuthenticated } = useAuth();
  const isNSFW = commission.isNSFW;
  
  // Determine if card should be blurred
  const shouldBlur = isNSFW && !isAuthenticated;
  
  return (
    <Card 
      className={`commission-card ${highlighted ? 'highlighted' : ''} ${shouldBlur ? 'blurred' : ''}`}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardActionArea component={Link} to={`/commission/${commission.commissionId || commission.requestId}`}>
        {commission.latestUpdate && (
          <CardMedia
            component="img"
            height="140"
            image={shouldBlur ? '/blur-placeholder.jpg' : commission.latestUpdate}
            alt={shouldBlur ? 'Blurred content' : 'Commission preview'}
          />
        )}
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" component="div" fontWeight="bold">
              {commission.status || 'Requested'}
            </Typography>
            {isNSFW && (
              <Chip 
                label="NSFW" 
                size="small" 
                color="error" 
                icon={shouldBlur ? <LockIcon fontSize="small" /> : undefined}
              />
            )}
          </Box>
          
          {commission.progress && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {commission.progress}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progressSteps[commission.progress] || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Chip 
              label={`${commission.characterCount || 1} character${commission.characterCount > 1 ? 's' : ''}`} 
              size="small" 
              variant="outlined"
            />
            {commission.alternativeCount > 0 && (
              <Chip 
                label={`${commission.alternativeCount} alt${commission.alternativeCount > 1 ? 's' : ''}`} 
                size="small" 
                variant="outlined"
              />
            )}
            {commission.poseCount > 1 && (
              <Chip 
                label={`${commission.poseCount} poses`} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={commission.complexity || 'Unknown'} 
              size="small"
              sx={{ 
                bgcolor: complexityColors[commission.complexity] || '#9E9E9E',
                color: 'white'
              }}
            />
            
            {(commission.requestDate || commission.createdAt) && (
              <Typography variant="caption" color="text.secondary">
                {format(new Date(commission.requestDate || commission.createdAt), 'MMM d, yyyy')}
              </Typography>
            )}
          </Box>
          
          {commission.expectedCompletionDate && isAuthenticated && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Expected: {format(new Date(commission.expectedCompletionDate), 'MMM d, yyyy')}
            </Typography>
          )}
          
          {shouldBlur && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                size="small" 
                color="primary" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLoginClick && onLoginClick();
                }}
              >
                Login to View
              </Button>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CommissionCard; 