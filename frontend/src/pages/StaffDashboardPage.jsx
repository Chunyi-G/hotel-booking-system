import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import LoadingState from '../components/LoadingState'
import { compareSortValues, getBookingSortValue } from '../utils/bookingSort'
import { formatCurrency, formatDate } from '../utils/formatters'

function StaffDashboardPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardFilters, setDashboardFilters] = useState({
    customerName: '',
    status: '',
  })
  const [sortConfig, setSortConfig] = useState({
    field: 'id',
    direction: 'desc',
  })

  const filteredAndSortedBookings = useMemo(() => {
    const customerName = dashboardFilters.customerName.trim().toLowerCase()

    const filteredBookings = bookings.filter((booking) => {
      const matchesName = booking.customer_name.toLowerCase().includes(customerName)
      const matchesStatus = dashboardFilters.status
        ? booking.status === dashboardFilters.status
        : true

      return matchesName && matchesStatus
    })

    return filteredBookings.sort((firstBooking, secondBooking) => {
      const firstValue = getBookingSortValue(firstBooking, sortConfig.field)
      const secondValue = getBookingSortValue(secondBooking, sortConfig.field)
      const comparison = compareSortValues(firstValue, secondValue)

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [bookings, dashboardFilters, sortConfig])

  const bookingStatuses = useMemo(() => {
    return [...new Set(bookings.map((booking) => booking.status))].sort()
  }, [bookings])

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/bookings')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load bookings.')
        }

        setBookings(payload.data || [])
      } catch (loadError) {
        setBookings([])
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDashboardFilterChange = (event) => {
    const { name, value } = event.target
    setDashboardFilters((current) => ({ ...current, [name]: value }))
  }

  const renderSortLabel = (field, label) => (
    <TableSortLabel
      active={sortConfig.field === field}
      direction={sortConfig.field === field ? sortConfig.direction : 'asc'}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <Box className="app-shell">
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box className="page-header">
              <Typography component="h1" variant="h1">
                Staff Dashboard
              </Typography>
              <Typography color="text.secondary">
                View hotel bookings. Click sortable headers to change order.
              </Typography>
            </Box>
            <Box>
              <Button component={RouterLink} to="/" variant="outlined">
                Back to Rooms
              </Button>
            </Box>
          </Stack>

          {isLoading && <LoadingState message="Loading bookings" />}

          {error && <Alert severity="error">{error}</Alert>}

          {!isLoading && !error && bookings.length === 0 && (
            <Alert severity="info">No bookings found.</Alert>
          )}

          {!isLoading && !error && bookings.length > 0 && (
            <>
              <Card className="dashboard-filter-panel" variant="outlined">
                <Box className="dashboard-filter-grid">
                  <Box>
                    <TextField
                      fullWidth
                      label="Search Customer Name"
                      name="customerName"
                      value={dashboardFilters.customerName}
                      onChange={handleDashboardFilterChange}
                    />
                  </Box>
                  <Box>
                    <FormControl fullWidth>
                      <InputLabel id="booking-status-label">Status</InputLabel>
                      <Select
                        label="Status"
                        labelId="booking-status-label"
                        name="status"
                        value={dashboardFilters.status}
                        onChange={handleDashboardFilterChange}
                      >
                        <MenuItem value="">All statuses</MenuItem>
                        {bookingStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Card>

              {filteredAndSortedBookings.length === 0 ? (
                <Alert severity="info">No bookings match those filters.</Alert>
              ) : (
                <Card variant="outlined">
                  <TableContainer>
                    <Table className="bookings-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>{renderSortLabel('id', 'Booking ID')}</TableCell>
                          <TableCell>{renderSortLabel('room_number', 'Room Number')}</TableCell>
                          <TableCell>{renderSortLabel('customer_name', 'Customer Name')}</TableCell>
                          <TableCell>Customer Email</TableCell>
                          <TableCell>{renderSortLabel('check_in', 'Check In')}</TableCell>
                          <TableCell>{renderSortLabel('check_out', 'Check Out')}</TableCell>
                          <TableCell align="right">Guests</TableCell>
                          <TableCell align="right">Total Price</TableCell>
                          <TableCell>{renderSortLabel('status', 'Status')}</TableCell>
                          <TableCell align="right">History</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAndSortedBookings.map((booking) => (
                          <TableRow key={booking.id} hover>
                            <TableCell>#{booking.id}</TableCell>
                            <TableCell>{booking.room?.number}</TableCell>
                            <TableCell>{booking.customer_name}</TableCell>
                            <TableCell>{booking.customer_email}</TableCell>
                            <TableCell>{formatDate(booking.check_in)}</TableCell>
                            <TableCell>{formatDate(booking.check_out)}</TableCell>
                            <TableCell align="right">{booking.guests}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(booking.total_price)}
                            </TableCell>
                            <TableCell>
                              <Chip label={booking.status} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                component={RouterLink}
                                size="small"
                                to={`/rooms/${booking.room_id}/history`}
                                variant="outlined"
                              >
                                View History
                              </Button>
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

export default StaffDashboardPage
