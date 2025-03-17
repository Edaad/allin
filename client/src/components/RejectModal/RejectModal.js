import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import './RejectModal.css';

function RejectModal({
    open,
    onClose,
    rejectReason,
    setRejectReason,
    onSubmit
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
            }}>
                <h2 className='reject-heading'>
                    Reject Join Request
                </h2>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    margin="normal"
                    sx={{
                        '& .MuiInputBase-root': {
                            fontFamily: 'Outfit, sans-serif'
                        },
                        '& .MuiInputBase-input': {
                            fontFamily: 'Outfit, sans-serif'
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <button className='decline-button' onClick={onSubmit}>Decline</button>
                    <button className='cancel-button' onClick={onClose}>Cancel</button>
                </Box>
            </Box>
        </Modal>
    );
}

export default RejectModal;