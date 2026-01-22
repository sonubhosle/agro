import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const cropOptions = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice' },
  { value: 'tomato', label: 'Tomato' },
  { value: 'potato', label: 'Potato' },
  { value: 'onion', label: 'Onion' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'maize', label: 'Maize' },
  { value: 'pulses', label: 'Pulses' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
];

const qualityGrades = [
  { value: 'Premium', label: 'Premium' },
  { value: 'A', label: 'A Grade' },
  { value: 'B', label: 'B Grade' },
  { value: 'C', label: 'C Grade' },
  { value: 'Organic', label: 'Organic' },
];

const unitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'quintal', label: 'Quintal' },
  { value: 'ton', label: 'Tonne' },
];

const CropForm = ({ crop = null, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Crop name is required'),
    variety: Yup.string().required('Variety is required'),
    quantity: Yup.number()
      .required('Quantity is required')
      .positive('Quantity must be positive')
      .min(0.1, 'Minimum quantity is 0.1'),
    unit: Yup.string().required('Unit is required'),
    pricePerUnit: Yup.number()
      .required('Price is required')
      .positive('Price must be positive'),
    qualityGrade: Yup.string().required('Quality grade is required'),
    harvestDate: Yup.date().required('Harvest date is required'),
    description: Yup.string().max(1000, 'Description too long'),
    moistureContent: Yup.number()
      .min(0, 'Moisture content cannot be negative')
      .max(100, 'Moisture content cannot exceed 100%'),
    expiryDate: Yup.date().min(new Date(), 'Expiry date must be in future'),
    shelfLife: Yup.number().min(1, 'Shelf life must be at least 1 day'),
  });

  const formik = useFormik({
    initialValues: {
      name: crop?.name || '',
      variety: crop?.variety || '',
      quantity: crop?.quantity || '',
      unit: crop?.unit || 'kg',
      pricePerUnit: crop?.pricePerUnit || '',
      qualityGrade: crop?.qualityGrade || 'B',
      harvestDate: crop?.harvestDate ? new Date(crop.harvestDate).toISOString().split('T')[0] : '',
      description: crop?.description || '',
      moistureContent: crop?.moistureContent || '',
      expiryDate: crop?.expiryDate ? new Date(crop.expiryDate).toISOString().split('T')[0] : '',
      shelfLife: crop?.shelfLife || '',
      tags: crop?.tags?.join(', ') || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        
        // Add form values
        Object.keys(values).forEach(key => {
          if (values[key]) {
            formData.append(key, values[key]);
          }
        });

        // Add images
        uploadedImages.forEach((image, index) => {
          if (image.file) {
            formData.append('images', image.file);
          }
        });

        if (crop) {
          // Update existing crop
          const response = await api.put(`/crops/${crop._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          toast.success('Crop updated successfully');
          onSuccess?.(response.data.data.crop);
        } else {
          // Create new crop
          const response = await api.post('/crops', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          toast.success('Crop listed successfully');
          onSuccess?.(response.data.data.crop);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Something went wrong');
      }
    },
  });

  useEffect(() => {
    if (crop?.images) {
      setPreviewImages(crop.images.map(img => ({
        url: img.url,
        id: img.publicId,
        isExisting: true
      })));
    }
  }, [crop]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length + previewImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    
    try {
      const newImages = [];
      
      for (const file of files) {
        // Create preview
        const previewUrl = URL.createObjectURL(file);
        const imageData = {
          id: Date.now() + Math.random(),
          url: previewUrl,
          file,
          isExisting: false
        };
        
        newImages.push(imageData);
        setUploadedImages(prev => [...prev, imageData]);
      }
      
      setPreviewImages(prev => [...prev, ...newImages]);
    } catch (error) {
      toast.error('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const imageToRemove = previewImages[index];
    
    if (imageToRemove.isExisting) {
      // Mark existing image for deletion
      formik.setFieldValue(
        'imagesToDelete',
        [...(formik.values.imagesToDelete || []), imageToRemove.id]
      );
    } else {
      // Remove uploaded file
      setUploadedImages(uploadedImages.filter(img => img.id !== imageToRemove.id));
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crop Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Name *
          </label>
          <select
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.name && formik.errors.name
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          >
            <option value="">Select Crop</option>
            {cropOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.name && formik.errors.name && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
          )}
        </div>

        {/* Variety */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variety *
          </label>
          <input
            type="text"
            name="variety"
            value={formik.values.variety}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="e.g., Basmati, Alphonso, etc."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.variety && formik.errors.variety
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {formik.touched.variety && formik.errors.variety && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.variety}</p>
          )}
        </div>

        {/* Quantity and Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            step="0.1"
            min="0.1"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.quantity && formik.errors.quantity
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {formik.touched.quantity && formik.errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.quantity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit *
          </label>
          <select
            name="unit"
            value={formik.values.unit}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.unit && formik.errors.unit
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          >
            {unitOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price per unit (₹) *
          </label>
          <input
            type="number"
            name="pricePerUnit"
            value={formik.values.pricePerUnit}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.pricePerUnit && formik.errors.pricePerUnit
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {formik.touched.pricePerUnit && formik.errors.pricePerUnit && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.pricePerUnit}</p>
          )}
        </div>

        {/* Quality Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality Grade *
          </label>
          <select
            name="qualityGrade"
            value={formik.values.qualityGrade}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.qualityGrade && formik.errors.qualityGrade
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          >
            {qualityGrades.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Harvest Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Harvest Date *
          </label>
          <input
            type="date"
            name="harvestDate"
            value={formik.values.harvestDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              formik.touched.harvestDate && formik.errors.harvestDate
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {formik.touched.harvestDate && formik.errors.harvestDate && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.harvestDate}</p>
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formik.values.expiryDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Moisture Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moisture Content (%)
          </label>
          <input
            type="number"
            name="moistureContent"
            value={formik.values.moistureContent}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            step="0.1"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Shelf Life */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shelf Life (days)
          </label>
          <input
            type="number"
            name="shelfLife"
            value={formik.values.shelfLife}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma separated)
        </label>
        <input
          type="text"
          name="tags"
          value={formik.values.tags}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="e.g., organic, fresh, premium, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            formik.touched.description && formik.errors.description
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="Describe your crop (max 1000 characters)"
          maxLength={1000}
        />
        <div className="flex justify-between mt-1">
          {formik.touched.description && formik.errors.description ? (
            <p className="text-sm text-red-600">{formik.errors.description}</p>
          ) : (
            <span></span>
          )}
          <span className="text-sm text-gray-500">
            {formik.values.description.length}/1000
          </span>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Crop Images (Max 5)
        </label>
        
        {/* Image Preview Grid */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {previewImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={`Crop ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="h-4 w-4" />
                </button>
                {image.isExisting && (
                  <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    Existing
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {previewImages.length < 5 && (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}

        {uploading && (
          <div className="mt-2 text-sm text-gray-500">
            Uploading images...
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formik.isSubmitting || uploading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formik.isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {crop ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            crop ? 'Update Crop' : 'List Crop'
          )}
        </button>
      </div>
    </form>
  );
};

export default CropForm;