import { createTheme } from '@mui/material/styles';

// New Color Palette
const davyGray = '#5b5b5b';
const gray = '#7d7c7a';
const sage = '#c9c19f';
const nyanza = '#edf7d2';
const cream = '#edf7b5';

const theme = createTheme({
  palette: {
    primary: {
      main: sage, // Sage
      // MUI automatically calculates light and dark, or we can specify if needed
      contrastText: davyGray, // Davy's Gray for text on Sage
    },
    secondary: {
      main: davyGray, // Davy's Gray
      contrastText: cream, // Cream for text on Davy's Gray
    },
    error: {
      main: '#EA4335', // Keeping Material Design Red for errors, can be changed
    },
    warning: {
      main: '#FBBC05', // Keeping Material Design Yellow for warnings
    },
    info: {
      main: '#4285F4',   // Keeping Material Design Blue for info
    },
    success: {
      main: '#34A853', // Keeping Material Design Green for success
    },
    background: {
      default: nyanza, // Nyanza
      paper: cream,    // Cream
    },
    text: {
      primary: davyGray,   // Davy's Gray
      secondary: gray,     // Gray
    },
    divider: sage, // Using Sage for dividers, or a lighter gray like '#e0e0e0'
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600, // Adjusted for Poppins
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500, // Poppins 500 can be quite bold, 600 is bolder
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none', // Kept from original
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 22px', // Slightly more padding for a modern feel
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)', // Softer hover shadow
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: davyGray, // Darken Sage on hover or use secondary color
            color: cream, // Ensure contrast text updates if primary color changes significantly on hover
          }
        },
        containedSecondary: {
            backgroundColor: davyGray,
            color: cream,
           '&:hover': {
             backgroundColor: sage, // Example: lighten davyGray or use primary
             color: davyGray,
           }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Kept from original
          boxShadow: '0px 4px 12px rgba(91, 91, 91, 0.1)', // Using Davy's Gray for shadow color, softer
          border: `1px solid ${nyanza}`, // Subtle border using Nyanza (background default)
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Consistent with Card
          boxShadow: '0px 4px 12px rgba(91, 91, 91, 0.08)', // Softer shadow for general paper
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(91, 91, 91, 0.1)', // Softer shadow for AppBar
          backgroundColor: cream, // AppBar background as Cream
          color: davyGray,      // AppBar text as Davy's Gray
        },
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: cream, // Drawer background as Cream
                borderRight: `1px solid ${nyanza}`, // Subtle border
            }
        }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: nyanza, // Table head with Nyanza background
          color: davyGray,        // Text color for head cells
          borderBottom: `2px solid ${sage}`, // Stronger border for head
        },
        body: {
            color: gray, // Body text color
            borderColor: nyanza, // Lighter border color for table cells
        }
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            border: 0,
          },
          '&:hover': {
            backgroundColor: nyanza, // Hover with Nyanza
          },
        },
      },
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: sage, // Border color for text fields
                    },
                    '&:hover fieldset': {
                        borderColor: davyGray, // Border color on hover
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: davyGray, // Border color when focused
                    },
                    backgroundColor: cream, // Background of input itself
                },
                '& .MuiInputLabel-root': {
                    color: gray, // Label color
                },
                '& .MuiInputLabel-root.Mui-focused': {
                    color: davyGray, // Label color when focused
                }
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                fontWeight: 500,
            },
            filledPrimary: {
                backgroundColor: sage,
                color: davyGray,
            },
            filledSecondary: {
                backgroundColor: davyGray,
                color: cream,
            }
        }
    }
  },
  shape: {
    borderRadius: 12, // Increased default border radius for a more modern look
  },
});

export default theme;
