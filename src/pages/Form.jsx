import React, { useState } from "react";
import emailjs from "emailjs-com"; // Import EmailJS

const Form = () => {
  // State untuk menyimpan data form
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    role: "",
    experience: "",
    motivation: "",
    portfolio: "",
    cv: null,
  });

  // State untuk menangani pesan error
  const [errors, setErrors] = useState({});

  // State untuk menampilkan popup preview
  const [showPopup, setShowPopup] = useState(false);

  // State untuk loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi untuk menangani perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Fungsi untuk validasi form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.experience) newErrors.experience = "Experience level is required";
    if (!formData.motivation) newErrors.motivation = "Motivation is required";
    if (!formData.portfolio) newErrors.portfolio = "Portfolio URL is required";
    if (!formData.cv) newErrors.cv = "CV/Resume is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true jika tidak ada error
  };

  // Fungsi untuk menampilkan popup preview
  const handlePreview = () => {
    if (validateForm()) {
      setShowPopup(true);
    }
  };

  // Fungsi untuk menutup popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // Fungsi untuk convert file ke Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Fungsi untuk mengirim email
  const sendEmail = async () => {
    setIsSubmitting(true);

    try {
      // Convert file CV ke Base64
      const cvBase64 = await convertFileToBase64(formData.cv);

      // Data yang akan dikirim ke EmailJS
      const templateParams = {
        name: formData.name,
        age: formData.age,
        phone: formData.phone,
        role: formData.role,
        experience: formData.experience,
        motivation: formData.motivation,
        portfolio: formData.portfolio,
        cv: cvBase64, // Tambahkan CV sebagai attachment
        cv_filename: formData.cv.name, // Nama file CV
      };

      // Kirim email menggunakan EmailJS
      const response = await emailjs.send(
        "service_2mr4ogr", 
        "template_81poifc", 
        templateParams,
        "R7wHrRQKYtT1nBLG-" 
      );

      console.log("Email sent successfully!", response);
      alert("Application submitted successfully!");
      setShowPopup(false);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="glass p-8 rounded-lg w-full max-w-md mt-24 mb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Join Our Team</h1>
        <form className="space-y-6">
          {/* Input Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Input Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your age"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Input Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your WhatsApp number"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Input Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role in Programming
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Fullstack Developer">Fullstack Developer</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Machine Learning Engineer">Machine Learning Engineer</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          </div>

          {/* Input Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium mb-2">
              Level of Experience
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select your experience level
              </option>
              <option value="Fresh Graduate">Fresh Graduate</option>
              <option value="Junior (1-2 years)">Junior (1-2 years)</option>
              <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
              <option value="Senior (5+ years)">Senior (5+ years)</option>
            </select>
            {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
          </div>

          {/* Input Motivation */}
          <div>
            <label htmlFor="motivation" className="block text-sm font-medium mb-2">
              What motivates you to join our team?
            </label>
            <textarea
              id="motivation"
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              rows="4"
              placeholder="Share your motivation..."
            />
            {errors.motivation && <p className="text-red-500 text-sm mt-1">{errors.motivation}</p>}
          </div>

          {/* Input Portfolio */}
          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium mb-2">
              Portfolio/LinkedIn Profile (URL)
            </label>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="https://github.com/yourusername"
            />
            {errors.portfolio && <p className="text-red-500 text-sm mt-1">{errors.portfolio}</p>}
          </div>

          {/* Input CV */}
          <div>
            <label htmlFor="cv" className="block text-sm font-medium mb-2">
              Upload CV/Resume (PDF/DOCX, max 5MB)
            </label>
            <input
              type="file"
              id="cv"
              name="cv"
              accept=".pdf,.docx"
              onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            {errors.cv && <p className="text-red-500 text-sm mt-1">{errors.cv}</p>}
          </div>

          {/* Tombol Preview */}
          <button
            type="button"
            onClick={handlePreview}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Preview Data
          </button>
        </form>

        {/* Popup Preview */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="glass p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Preview Data</h2>
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Age:</strong> {formData.age}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Role:</strong> {formData.role}</p>
              <p><strong>Experience:</strong> {formData.experience}</p>
              <p><strong>Motivation:</strong> {formData.motivation}</p>
              <p><strong>Portfolio:</strong> {formData.portfolio}</p>
              <div className="flex justify-end mt-6">
                <button
                  onClick={closePopup}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={sendEmail}
                  disabled={isSubmitting}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;
