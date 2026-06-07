import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

function NavigationBar() {
  return (
    <AppBar className="app-nav" color="inherit" elevation={0} position="sticky">
      <Toolbar className="app-nav-toolbar">
        <Typography component={RouterLink} to="/" className="app-brand">
          Hotel Booking
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/" color="inherit">
            Rooms
          </Button>
          <Button component={RouterLink} to="/staff-dashboard" color="inherit">
            Staff Dashboard
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default NavigationBar
