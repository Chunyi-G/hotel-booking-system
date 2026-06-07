import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import LoadingState from '../components/LoadingState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getBookingStayStatus, getBookingStayStatusChipColor } from '../utils/roomStatus'

function RoomHistoryPage() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoomHistory = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/rooms/${id}/history`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load room history.')
        }

        setRoom(payload.data)
      } catch (loadError) {
        setRoom(null)
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRoomHistory()
  }, [id])

  return (
    <Box className="app-shell">
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack className="history-page-header" direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box className="page-header">
              <Typography component="h1" variant="h1">
                Room History
              </Typography>
              <Typography color="text.secondary">
                Review booking history for the selected room.
              </Typography>
            </Box>
            <Box className="history-page-action">
              <Button component={RouterLink} to="/staff-dashboard" variant="outlined" size="large">
                Back to Dashboard
              </Button>
            </Box>
          </Stack>

          {isLoading && <LoadingState message="Loading room history" />}

          {error && <Alert severity="error">{error}</Alert>}

          {!isLoading && !error && room && (
            <>
              <Card className="room-details-panel" variant="outlined">
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography color="text.secondary">Room Number</Typography>
                      <Typography fontWeight={700}>Room {room.number}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography color="text.secondary">Category</Typography>
                      <Typography fontWeight={700}>{room.category}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography color="text.secondary">Capacity</Typography>
                      <Typography fontWeight={700}>{room.capacity} guests</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography color="text.secondary">Price per Night</Typography>
                      <Typography fontWeight={700}>
                        {formatCurrency(room.price_per_night)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {room.bookings.length === 0 ? (
                <Alert severity="info">
                  This room does not have any booking history yet.
                </Alert>
              ) : (
                <Card variant="outlined">
                  <TableContainer>
                    <Table className="history-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer Name</TableCell>
                          <TableCell>Check In</TableCell>
                          <TableCell>Check Out</TableCell>
                          <TableCell align="right">Guests</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {room.bookings.map((booking) => (
                          <TableRow key={booking.id} hover>
                            <TableCell>{booking.customer_name}</TableCell>
                            <TableCell>{formatDate(booking.check_in)}</TableCell>
                            <TableCell>{formatDate(booking.check_out)}</TableCell>
                            <TableCell align="right">{booking.guests}</TableCell>
                            <TableCell>
                              <Chip
                                color={getBookingStayStatusChipColor(getBookingStayStatus(booking))}
                                label={getBookingStayStatus(booking)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

export default RoomHistoryPage
