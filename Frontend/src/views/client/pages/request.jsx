import React, { useState } from 'react';
import { 
  Typography, TextField, MenuItem, 
  Button, Box, Alert, CircularProgress, Stack, Collapse
} from '@mui/material';
import { UseAuth } from '../../../context/AuthContext'; 
import { UseRequests } from '../../../context/RequestContext';
import { UseMeta } from '../../../context/MetaContext';
import { Formik, FastField } from 'formik';
import * as Yup from 'yup';

const PURPOSE_CHOICES = [
  'Job Application',
  'Transfer of School',
  'Board Exam / Licensure',
  'Scholarship Application',
  'Government Requirement',
  'Further Studies / Graduate School',
  'Personal Record',
  'Other',
];

// ✅ Validation
const validationSchema = Yup.object({
  documentTypeId: Yup.number().required('Document type is required'),
  purposeChoice: Yup.string().required('Purpose is required'),
  purposeOther: Yup.string().when('purposeChoice', {
    is: 'Other',
    then: (s) => s.min(10, 'Minimum 10 characters').required('Please describe your purpose'),
    otherwise: (s) => s,
  }),
  quantity: Yup.number().min(1).required(),
  notes: Yup.string()
});

// ✅ Reusable Input
const FormInput = React.memo(({ name, label, type = "text", multiline, rows, children, select, ...props }) => {
  return (
    <FastField name={name}>
      {({ field, meta }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          type={type}
          label={label}
          multiline={multiline}
          rows={rows}
          select={select}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched ? meta.error : ""}
        >
          {children}
        </TextField>
      )}
    </FastField>
  );
});

function NewRequest({ onCancel, onSuccess, sx = {}, isModal = false }) {
  const { user } = UseAuth();
  const { createRequest } = UseRequests();
  const { documentTypes, loading: loadingMeta } = UseMeta();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  return (
    <Box sx={{
      px: { md: 1, xs:4}, 
      marginTop: 10, 
      width: { xs: '100%', md: '50%' },
      marginLeft: 'auto', 
      marginRight: 'auto',
      minWidth: { xs: '100%', md: '50%' },
      ...sx
    }}>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="800" color="#1B254B">
          New Request
        </Typography>
        <Typography variant="body2" color="#707EAE">
          Fill out the details below to submit your document request.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>Request submitted successfully!</Alert>}

      <Formik
        initialValues={{
          documentTypeId: '',
          purposeChoice: '',
          purposeOther: '',
          quantity: 1,
          notes: ''
        }}
        validationSchema={validationSchema}
        validateOnChange={false}
        validateOnBlur={true}
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          setLoading(true);
          setError('');

          try {
            const finalPurpose = values.purposeChoice === 'Other'
              ? values.purposeOther.trim()
              : values.purposeChoice;

            const payload = {
              userId: parseInt(user?.id) || 0,
              documentTypeId: parseInt(values.documentTypeId),
              purpose: finalPurpose,
              quantity: parseInt(values.quantity),
              notes: values.notes ? values.notes.trim() : ""
            };

            await createRequest(payload);

            resetForm();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            if (typeof onSuccess === 'function') onSuccess();

          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, values }) => (
          <Box component="form" onSubmit={handleSubmit} >
            <Stack spacing={2.5} >

              {/* Document Type + Qty */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormInput
                  name="documentTypeId"
                  label="Document Type"
                  select
                  sx={{ flex: 2 }}
                  disabled={loadingMeta}
                >
                  {documentTypes.length > 0 ? (
                    documentTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name || type.typeName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No document types available</MenuItem>
                  )}
                </FormInput>

                <FormInput
                  name="quantity"
                  label="Qty"
                  type="number"
                  inputProps={{ min: 1 }}
                  sx={{ flex: 0.5 }}
                />
              </Stack>

              {/* Purpose — dropdown with preset choices */}
              <FormInput
                name="purposeChoice"
                label="Purpose"
                select
              >
                {PURPOSE_CHOICES.map((choice) => (
                  <MenuItem key={choice} value={choice}>{choice}</MenuItem>
                ))}
              </FormInput>

              {/* "Other" free-text — only shown when Other is selected */}
              <Collapse in={values.purposeChoice === 'Other'}>
                <FormInput
                  name="purposeOther"
                  label="Please describe your purpose"
                  multiline
                  rows={3}
                  placeholder="Describe your purpose (minimum 10 characters)..."
                />
              </Collapse>

              {/* Notes */}
              <FormInput
                name="notes"
                label="Additional Notes (Optional)"
                multiline
                rows={2}
              />

              {/* Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {isModal && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={onCancel}
                    sx={{ 
                      borderRadius: '12px', 
                      py: 1.5, 
                      textTransform: 'none', 
                      fontWeight: 700, 
                      color: '#707EAE', 
                      borderColor: '#E0E5F2' 
                    }}
                  >
                    Cancel
                  </Button>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || loadingMeta}
                  sx={{ 
                    bgcolor: '#1A237E', 
                    borderRadius: '12px', 
                    py: 1.5, 
                    textTransform: 'none', 
                    fontWeight: 700,
                    boxShadow: '0px 10px 20px rgba(26, 35, 126, 0.2)',
                    '&:hover': { bgcolor: '#311B92' }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Request'}
                </Button>
              </Stack>

            </Stack>
          </Box>
        )}
      </Formik>
    </Box>
  );
}

export default NewRequest;