import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Box, Typography, MenuItem, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Register: React.FC = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      registerCode: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Please enter a valid email').required('Please enter your email'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Please enter your password'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
      role: Yup.string().oneOf(['user', 'operator']).required('Please select a role'),
      registerCode: Yup.string().when('role', (role: any, schema) =>
        (role === 'operator' || (Array.isArray(role) && role[0] === 'operator'))
          ? schema.required('Register code is required for operators')
          : schema.notRequired()
      ),
    }),
    onSubmit: async (values) => {
      setError('');
      setSuccess('');
      try {
        await api.post('/auth/register', {
          email: values.email,
          password: values.password,
          role: values.role,
          registerCode: values.role === 'operator' ? values.registerCode : '',
        });
        setSuccess('Registration successful, please login');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    },
  });

  return (
    <Box maxWidth={400} mx="auto" mt={4}>
      <Typography variant="h5" mb={2}>Register</Typography>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />
        <TextField
          fullWidth
          margin="normal"
          id="password"
          name="password"
          label="Password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />
        <TextField
          fullWidth
          margin="normal"
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
          helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
        />
        <TextField
          select
          fullWidth
          margin="normal"
          id="role"
          name="role"
          label="Role"
          value={formik.values.role}
          onChange={formik.handleChange}
        >
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="operator">Operator</MenuItem>
        </TextField>
        {formik.values.role === 'operator' && (
          <TextField
            fullWidth
            margin="normal"
            id="registerCode"
            name="registerCode"
            label="Operator Register Code"
            value={formik.values.registerCode}
            onChange={formik.handleChange}
            error={formik.touched.registerCode && Boolean(formik.errors.registerCode)}
            helperText={formik.touched.registerCode && formik.errors.registerCode}
          />
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        <Button color="primary" variant="contained" fullWidth type="submit" sx={{ mt: 2 }}>
          Register
        </Button>
      </form>
    </Box>
  );
};

export default Register; 