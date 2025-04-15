import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Paper,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PaletteIcon from '@mui/icons-material/Palette';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9)), url(/hero-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          py: 8,
          borderRadius: 0,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700, 
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                mb: 3
              }}
            >
              Custom Art Commissions
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ mb: 4, fontWeight: 300 }}
            >
              Bring your ideas to life with personalized artwork
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                component={Link}
                to="/request"
                startIcon={<AddCircleOutlineIcon />}
                sx={{ 
                  minWidth: 200,
                  py: 1.5
                }}
              >
                Request Commission
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                size="large"
                component={Link}
                to="/queue"
                startIcon={<ViewListIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderColor: 'white',
                  color: 'white',
                  minWidth: 200,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderColor: 'white',
                  }
                }}
              >
                View Commission Queue
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Services Section */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{ 
              textAlign: 'center',
              fontWeight: 600,
              mb: 3
            }}
          >
            Commission Services
          </Typography>
          <Divider sx={{ mb: 4 }}/>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image="/service-illustration.jpg"
                  alt="Normal art commission"
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    Normal Art Commission
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Custom artwork with your characters in the style of your choice. 
                    Options for multiple characters, poses, and alternative versions.
                  </Typography>
                  <Typography variant="subtitle1" color="primary" fontWeight="bold">
                    Base Price: $35
                  </Typography>
                  <Button
                    component={Link}
                    to="/request"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Order Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Placeholder cards for future services */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <PaletteIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2, opacity: 0.7 }} />
                <Typography variant="h6" align="center" gutterBottom>
                  More Services Coming Soon
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Additional commission types will be available in the future.
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <PaletteIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2, opacity: 0.7 }} />
                <Typography variant="h6" align="center" gutterBottom>
                  Custom Service Request
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Need something specific? Contact me to discuss custom commissions.
                </Typography>
                <Button
                  component={Link}
                  to="/request"
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Contact
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* How It Works Section */}
        <Box sx={{ my: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{ 
              textAlign: 'center',
              fontWeight: 600,
              mb: 3
            }}
          >
            How It Works
          </Typography>
          <Divider sx={{ mb: 4 }}/>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 30,
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" gutterBottom>
                  Submit Your Request
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill out the commission form with your details, references, and requirements.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 30,
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" gutterBottom>
                  Follow Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track your commission status and receive updates throughout the creation process.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 30,
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" gutterBottom>
                  Receive Your Artwork
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download your finalized artwork in high resolution once it's completed.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/request"
            >
              Start Your Commission
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage; 