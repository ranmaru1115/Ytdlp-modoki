import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { VideoMetadata } from '../api/client';

interface MediaInfoCardProps {
  metadata: VideoMetadata;
}

export const MediaInfoCard: React.FC<MediaInfoCardProps> = ({ metadata }) => {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 3,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {metadata.thumbnail && (
        <CardMedia
          component="img"
          sx={{
            width: { xs: '100%', sm: 180 },
            height: { xs: 160, sm: 'auto' },
            objectFit: 'cover',
          }}
          image={metadata.thumbnail}
          alt={metadata.title}
        />
      )}
      <CardContent
        sx={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            fontWeight: 600,
            lineHeight: 1.35,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {metadata.title}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {metadata.uploader && (
            <Chip
              size="small"
              icon={<PersonOutlineRoundedIcon sx={{ fontSize: '16px !important' }} />}
              label={metadata.uploader}
              variant="outlined"
              sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
            />
          )}
          {metadata.durationString && (
            <Chip
              size="small"
              icon={<AccessTimeRoundedIcon sx={{ fontSize: '16px !important' }} />}
              label={metadata.durationString}
              variant="outlined"
              sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
