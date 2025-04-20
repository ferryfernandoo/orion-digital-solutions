import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiCheckCircle, FiX, FiLoader } from "react-icons/fi";

const Form = () => {
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

  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fileName, setFileName] = useState("");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const popupVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: { scale: 0.9, opacity: 0 },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.experience) newErrors.experience = "Experience level is required";
    if (!formData.motivation.trim()) newErrors.motivation = "Motivation is required";
    if (!formData.portfolio.trim()) newErrors.portfolio = "Portfolio URL is required";
    if (!formData.cv) newErrors.cv = "CV/Resume is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, cv: "File size must be less than 5MB" });
        return;
      }
      setFormData({ ...formData, cv: file });
      setFileName(file.name);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const sendEmail = async () => {
    setIsSubmitting(true);

    try {
      const cvBase64 = await convertFileToBase64(formData.cv);

      const templateParams = {
        name: formData.name,
        age: formData.age,
        phone: formData.phone,
        role: formData.role,
        experience: formData.experience,
        motivation: formData.motivation,
        portfolio: formData.portfolio,
        cv: cvBase64,
        cv_filename: formData.cv.name,
      };

      await emailjs.send(
        "service_2mr4ogr",
        "template_81poifc",
        templateParams,
        "R7wHrRQKYtT1nBLG-"
      );

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowPopup(false);
        setSubmitSuccess(false);
        // Reset form
        setFormData({
          name: "",
          age: "",
          phone: "",
          role: "",
          experience: "",
          motivation: "",
          portfolio: "",
          cv: null,
        });
        setFileName("");
      }, 2000);
    } catch (error) {
      console.error("Failed to send email:", error);
      setErrors({ ...errors, submit: "Failed to submit application. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700"
        >
          <div className="p-8">
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Join Our Team
              </h1>
              <p className="text-gray-400 text-center mb-8">
                Fill out the form below to apply for a position
              </p>
            </motion.div>

            <motion.form className="space-y-6" variants={containerVariants}>
              {/* Name */}
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.name}</p>
                )}
              </motion.div>

              {/* Age and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label htmlFor="age" className="block text-sm font-medium mb-2 text-gray-300">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="25"
                    min="18"
                    max="70"
                  />
                  {errors.age && (
                    <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.age}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-300">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="+6281234567890"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.phone}</p>
                  )}
                </motion.div>
              </div>

              {/* Role and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-300">
                    Role in Programming <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none"
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
                  {errors.role && (
                    <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.role}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="experience" className="block text-sm font-medium mb-2 text-gray-300">
                    Level of Experience <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none"
                  >
                    <option value="" disabled>
                      Select your experience
                    </option>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                    <option value="Junior (1-2 years)">Junior (1-2 years)</option>
                    <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                    <option value="Senior (5+ years)">Senior (5+ years)</option>
                  </select>
                  {errors.experience && (
                    <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.experience}</p>
                  )}
                </motion.div>
              </div>

              {/* Motivation */}
              <motion.div variants={itemVariants}>
                <label htmlFor="motivation" className="block text-sm font-medium mb-2 text-gray-300">
                  What motivates you to join our team? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  rows="4"
                  placeholder="I'm excited about the opportunity because..."
                />
                {errors.motivation && (
                  <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.motivation}</p>
                )}
              </motion.div>

              {/* Portfolio */}
              <motion.div variants={itemVariants}>
                <label htmlFor="portfolio" className="block text-sm font-medium mb-2 text-gray-300">
                  Portfolio/LinkedIn Profile (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {errors.portfolio && (
                  <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.portfolio}</p>
                )}
              </motion.div>

              {/* CV Upload */}
              <motion.div variants={itemVariants}>
                <label htmlFor="cv" className="block text-sm font-medium mb-2 text-gray-300">
                  Upload CV/Resume (PDF/DOCX, max 5MB) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="cv"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition duration-200"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF or DOCX (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="cv"
                      name="cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-300 flex items-center">
                    <FiCheckCircle className="text-green-500 mr-2" /> {fileName}
                  </p>
                )}
                {errors.cv && (
                  <p className="text-red-400 text-sm mt-1 animate-pulse">{errors.cv}</p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-4">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-[1.01] shadow-lg"
                >
                  Preview Application
                </button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
      </motion.div>

      {/* Preview Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-70 z-50">
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Application Preview
                  </h2>
                  <button
                    onClick={closePopup}
                    className="text-gray-400 hover:text-white transition duration-200"
                    disabled={isSubmitting}
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500 mb-4">
                      <FiCheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Application Submitted!
                    </h3>
                    <p className="text-gray-400">
                      Thank you for your application. We'll review it and get back to you soon.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Full Name</h3>
                        <p className="text-white">{formData.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Age</h3>
                        <p className="text-white">{formData.age}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Phone</h3>
                        <p className="text-white">{formData.phone}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Role</h3>
                        <p className="text-white">{formData.role}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Experience</h3>
                        <p className="text-white">{formData.experience}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Portfolio</h3>
                        <a
                          href={formData.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {formData.portfolio}
                        </a>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Motivation</h3>
                      <p className="text-white whitespace-pre-line">{formData.motivation}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">CV/Resume</h3>
                      <p className="text-white flex items-center">
                        <FiCheckCircle className="text-green-500 mr-2" /> {formData.cv?.name}
                      </p>
                    </div>

                    {errors.submit && (
                      <div className="mb-4 p-3 bg-red-900 bg-opacity-30 rounded-lg text-red-400">
                        {errors.submit}
                      </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        onClick={closePopup}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendEmail}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Form;