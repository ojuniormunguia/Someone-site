import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';
import { getKanbanData } from '../utils/api';
import CommissionCard from '../components/CommissionCard';

const QueuePage = () => {
  const [kanbanData, setKanbanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchKanbanData();
  }, []);

  const fetchKanbanData = async () => {
    try {
      setLoading(true);
      const response = await getKanbanData();
      setKanbanData(response.data);
    } catch (error) {
      console.error('Error fetching kanban data:', error);
      setError('Failed to load commission queue. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLoginClick = () => {
    navigate('/login', { state: { from: '/queue' } });
  };

  const renderKanbanColumn = (title, items, emptyMessage) => (
    <Box className="kanban-column">
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {items && items.length > 0 ? (
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid item xs={12} sm={6} md={12} lg={6} key={index}>
              <CommissionCard 
                commission={item} 
                highlighted={false} 
                onLoginClick={handleLoginClick}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );

  const renderMobileView = () => {
    const statuses = ['Requested', 'Accepted', 'Working', 'Waiting', 'Finished'];
    const currentStatus = statuses[tabValue];
    
    return (
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
              },
            }}
          >
            {statuses.map((status) => (
              <Tab 
                key={status} 
                label={status} 
                sx={{ 
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                }} 
              />
            ))}
          </Tabs>
        </Paper>
        
        {kanbanData && renderKanbanColumn(
          currentStatus,
          kanbanData[currentStatus],
          `No commissions in ${currentStatus.toLowerCase()} status`
        )}
      </Box>
    );
  };

  const renderDesktopView = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} lg={2.4}>
        {renderKanbanColumn('Requested', kanbanData?.Requested, 'No new requests')}
      </Grid>
      <Grid item xs={12} md={6} lg={2.4}>
        {renderKanbanColumn('Accepted', kanbanData?.Accepted, 'No accepted commissions')}
      </Grid>
      <Grid item xs={12} md={6} lg={2.4}>
        {renderKanbanColumn('Working', kanbanData?.Working, 'No commissions in progress')}
      </Grid>
      <Grid item xs={12} md={6} lg={2.4}>
        {renderKanbanColumn('Waiting', kanbanData?.Waiting, 'No waiting commissions')}
      </Grid>
      <Grid item xs={12} md={6} lg={2.4}>
        {renderKanbanColumn('Finished', kanbanData?.Finished, 'No finished commissions')}
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Commission Queue
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Track the status of all commissions in my workflow. Click on any card to view more details.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          {renderMobileView()}
        </Box>
      )}

      {!loading && !error && (
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          {renderDesktopView()}
        </Box>
      )}
    </Box>
  );
};

export default QueuePage; 