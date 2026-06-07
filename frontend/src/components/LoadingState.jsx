import { Box, CircularProgress, Typography } from '@mui/material'

function LoadingState({ message }) {
  return (
    <Box className="loading-state">
      <CircularProgress size={28} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  )
}

export default LoadingState
