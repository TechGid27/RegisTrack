import React, { useEffect, useRef, useState } from 'react';
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
  notes: Yup.string(),
  deliveryMethod: Yup.string().oneOf(['Pickup', 'CashOnDelivery', 'SoftcopyOnly']).required('Choose how to receive your documents'),
  address: Yup.string().when('deliveryMethod', {
    is: 'CashOnDelivery',
    then: (schema) => schema.trim().max(500).required('Delivery address is required'),
  }),
  postalCode: Yup.string().when('deliveryMethod', {
    is: 'CashOnDelivery',
    then: (schema) => schema.trim().max(20).required('Postal code is required'),
  }),
  paymentMethod: Yup.string().oneOf(['PayMongo', 'COD']).required('Choose a payment method')
});

// ✅ Reusable Input
const FormInput = React.memo(({ name, label, type = "text", multiline, rows, children, select, onChange, ...props }) => {
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
          onChange={(event) => {
            field.onChange(event);
            onChange?.(event);
          }}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched ? meta.error : ""}
        >
          {children}
        </TextField>
      )}
    </FastField>
  );
});

function InteractiveSelect({ id, label, placeholder, value, options, error, onChange, onBlur }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = (restoreFocus = false) => {
    setOpen(false);
    onBlur?.();
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        onBlur?.();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onBlur]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const openAt = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActiveIndex(index);
    setOpen(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', paddingTop: 10, width: '100%' }}>
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          top: 0,
          left: 12,
          zIndex: 1,
          padding: '0 4px',
          backgroundColor: '#fff',
          color: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)',
          fontSize: '0.875rem',
          lineHeight: 1,
        }}
      >
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-invalid={Boolean(error)}
        onClick={() => (open ? close() : openAt())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openAt(selectedIndex >= 0 ? selectedIndex : 0);
          }
        }}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: 84,
          padding: '16px',
          border: `1px solid ${error ? '#d32f2f' : '#c4c4c4'}`,
          borderRadius: 4,
          backgroundColor: '#fff',
          color: selectedOption ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
          font: 'inherit',
          fontSize: '1.125rem',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span
          aria-hidden="true"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #757575',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      <div
        id={`${id}-options`}
        role="listbox"
        aria-label={label}
        style={{
          position: 'absolute',
          zIndex: 20,
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          maxHeight: open ? 240 : 0,
          overflowY: 'auto',
          borderRadius: 4,
          backgroundColor: '#fff',
          boxShadow: '0 5px 16px rgba(0, 0, 0, 0.2)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'max-height 180ms ease, opacity 150ms ease, transform 180ms ease',
          visibility: open ? 'visible' : 'hidden',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={(element) => { optionRefs.current[index] = element; }}
            type="button"
            role="option"
            aria-selected={option.value === value}
            tabIndex={open ? 0 : -1}
            onFocus={() => setActiveIndex(index)}
            onClick={() => {
              onChange(option.value);
              close(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                setActiveIndex((index + direction + options.length) % options.length);
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
              }
            }}
            style={{
              display: 'block',
              width: '100%',
              minHeight: 52,
              padding: '12px 16px',
              border: 0,
              backgroundColor: option.value === value ? '#f2f3f5' : '#fff',
              color: 'rgba(0, 0, 0, 0.87)',
              font: 'inherit',
              fontSize: '1.125rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <span style={{ color: '#d32f2f', fontSize: '0.75rem', margin: '3px 14px 0', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}

function NewRequest({ onCancel, onSuccess, sx = {}, isModal = false }) {
  const { user } = UseAuth();
  const { createRequest } = UseRequests();
  const { documentTypes, loading: loadingMeta } = UseMeta();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

      <Formik
        initialValues={{
          documentTypeId: '',
          purposeChoice: '',
          purposeOther: '',
          quantity: 1,
          notes: '',
          deliveryMethod: '',
          address: '',
          postalCode: '',
          paymentMethod: 'COD'
        }}
        validationSchema={validationSchema}
        validateOnChange={false}
        validateOnBlur={true}
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          setLoading(true);
          setError('');
          setSuccess('');

          try {
            const finalPurpose = values.purposeChoice === 'Other'
              ? values.purposeOther.trim()
              : values.purposeChoice;
            const selectedDocumentType = documentTypes.find(
              (type) => String(type.id) === String(values.documentTypeId)
            );
            const totalFee = Number(selectedDocumentType?.processingFee || 0) * Number(values.quantity);

            const payload = new FormData();
            payload.append('userId', String(parseInt(user?.id, 10) || 0));
            payload.append('documentTypeId', String(parseInt(values.documentTypeId, 10)));
            payload.append('purpose', finalPurpose);
            payload.append('quantity', String(parseInt(values.quantity, 10)));
            payload.append('notes', values.notes ? values.notes.trim() : '');
            payload.append('deliveryMethod', values.deliveryMethod);
            if (values.deliveryMethod === 'CashOnDelivery') {
              payload.append('address', values.address.trim());
              payload.append('postalCode', values.postalCode.trim());
            }
            payload.append('paymentMethod', totalFee > 0 ? values.paymentMethod : 'None');

            const result = await createRequest(payload);
            if (result?.checkoutUrl) {
              window.location.assign(result.checkoutUrl);
              return;
            }

            resetForm();
            const successMessage = totalFee > 0 && values.deliveryMethod === 'CashOnDelivery'
              ? 'Request submitted. Please pay in cash when your documents are delivered.'
              : totalFee > 0 && values.deliveryMethod === 'Pickup'
                ? 'Request submitted. Please pay in person when picking up your documents.'
                : 'Request submitted successfully!';
            setSuccess(successMessage);
            setTimeout(() => setSuccess(''), 3000);
            if (typeof onSuccess === 'function') onSuccess();

          } catch (err) {
            setError(err.message || 'Failed to submit the document request.');
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, values, errors, touched, setFieldValue, setValues, setFieldTouched }) => {
          const selectedDocumentType = documentTypes.find(
            (type) => String(type.id) === String(values.documentTypeId)
          );
          const totalFee = Number(selectedDocumentType?.processingFee || 0) * Number(values.quantity || 0);

          return (
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

              <InteractiveSelect
                id="deliveryMethod"
                label="How would you like to receive your documents?"
                placeholder="Select a delivery method"
                value={values.deliveryMethod}
                error={touched.deliveryMethod ? errors.deliveryMethod : ''}
                options={[
                  { value: 'Pickup', label: 'Pick up printed documents' },
                  { value: 'CashOnDelivery', label: 'Cash on delivery' },
                  { value: 'SoftcopyOnly', label: 'Softcopy only' },
                ]}
                onChange={(deliveryMethod) => {
                  setValues((currentValues) => ({
                    ...currentValues,
                    deliveryMethod,
                    paymentMethod: deliveryMethod === 'SoftcopyOnly' ? 'PayMongo' : 'COD',
                  }));
                }}
                onBlur={() => setFieldTouched('deliveryMethod', true)}
              />

              <Collapse in={values.deliveryMethod === 'CashOnDelivery'}>
                <Stack spacing={2}>
                  <FormInput
                    name="address"
                    label="Delivery address"
                    multiline
                    rows={3}
                    placeholder="House/building, street, barangay, city, province"
                  />
                  <FormInput
                    name="postalCode"
                    label="Postal code"
                    inputProps={{ maxLength: 20 }}
                  />
                </Stack>
              </Collapse>

              {values.documentTypeId && (
                totalFee > 0 ? (
                  <>
                    <Alert severity="info">
                      Processing fee: ₱{Number(selectedDocumentType.processingFee).toLocaleString()} × {values.quantity} = ₱{totalFee.toLocaleString()}
                    </Alert>
                    {values.deliveryMethod ? (
                      <InteractiveSelect
                        id="paymentMethod"
                        label="Payment method"
                        placeholder="Select a payment method"
                        value={values.paymentMethod}
                        error={touched.paymentMethod ? errors.paymentMethod : ''}
                        options={
                          values.deliveryMethod === 'Pickup'
                            ? [
                                { value: 'COD', label: 'Cash at registrar when picking up' },
                                { value: 'PayMongo', label: 'Online payment' },
                              ]
                            : values.deliveryMethod === 'CashOnDelivery'
                              ? [{ value: 'COD', label: 'Cash on delivery' }]
                              : [{ value: 'PayMongo', label: 'Online payment' }]
                        }
                        onChange={(paymentMethod) => setFieldValue('paymentMethod', paymentMethod)}
                        onBlur={() => setFieldTouched('paymentMethod', true)}
                      />
                    ) : (
                      <p style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
                        Choose how to receive your documents to select a payment method.
                      </p>
                    )}
                  </>
                ) : (
                  <Alert severity="info">No processing fee is required for this document.</Alert>
                )
              )}

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
                  {loading ? <CircularProgress size={24} color="inherit" /> : (
                    totalFee > 0 && values.deliveryMethod === 'SoftcopyOnly'
                      ? 'Continue to online payment'
                      : 'Submit Request'
                  )}
                </Button>
              </Stack>

            </Stack>
          </Box>
          );
        }}
      </Formik>
    </Box>
  );
}

export default NewRequest;