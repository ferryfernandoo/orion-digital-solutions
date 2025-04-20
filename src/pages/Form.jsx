import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiCheckCircle, FiX, FiLoader, FiExternalLink } from "react-icons/fi";

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

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        mass: 0.5
      },
    },
  };

  const popupVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
    exit: { 
      scale: 0.95, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const cardHover = {
    y: -3,
    transition: { type: "spring", stiffness: 400, damping: 10 }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-4"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700"
          whileHover={{ 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8 md:p-10">
            <motion.div 
              variants={itemVariants}
              className="mb-10"
            >
              <h1 className="text-4xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Join Our Team
              </h1>
              <motion.p 
                className="text-gray-400 text-center text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                We're looking for talented individuals to join our growing team
              </motion.p>
            </motion.div>

            <motion.form 
              className="space-y-8"
              variants={containerVariants}
            >
              {/* Name */}
              <motion.div 
                variants={itemVariants}
                whileHover={cardHover}
              >
                <label htmlFor="name" className="block text-sm font-medium mb-3 text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <motion.input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  placeholder="John Doe"
                  whileFocus={{ 
                    scale: 1.01,
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                  }}
                />
                {errors.name && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.name}
                  </motion.p>
                )}
              </motion.div>

              {/* Age and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  variants={itemVariants}
                  whileHover={cardHover}
                >
                  <label htmlFor="age" className="block text-sm font-medium mb-3 text-gray-300">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                    placeholder="25"
                    min="18"
                    max="70"
                    whileFocus={{ 
                      scale: 1.01,
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                    }}
                  />
                  {errors.age && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.age}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  whileHover={cardHover}
                >
                  <label htmlFor="phone" className="block text-sm font-medium mb-3 text-gray-300">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                    placeholder="+6281234567890"
                    whileFocus={{ 
                      scale: 1.01,
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                    }}
                  />
                  {errors.phone && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.phone}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Role and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  variants={itemVariants}
                  whileHover={cardHover}
                >
                  <label htmlFor="role" className="block text-sm font-medium mb-3 text-gray-300">
                    Role in Programming <span className="text-red-500">*</span>
                  </label>
                  <motion.select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 appearance-none"
                    whileFocus={{ 
                      scale: 1.01,
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                    }}
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Fullstack Developer">Fullstack Developer</option>
                    <option value="Mobile Developer">Mobile Developer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                  </motion.select>
                  {errors.role && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.role}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  whileHover={cardHover}
                >
                  <label htmlFor="experience" className="block text-sm font-medium mb-3 text-gray-300">
                    Level of Experience <span className="text-red-500">*</span>
                  </label>
                  <motion.select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 appearance-none"
                    whileFocus={{ 
                      scale: 1.01,
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                    }}
                  >
                    <option value="" disabled>Select your experience</option>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                    <option value="Junior (1-2 years)">Junior (1-2 years)</option>
                    <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                    <option value="Senior (5+ years)">Senior (5+ years)</option>
                  </motion.select>
                  {errors.experience && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.experience}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Motivation */}
              <motion.div 
                variants={itemVariants}
                whileHover={cardHover}
              >
                <label htmlFor="motivation" className="block text-sm font-medium mb-3 text-gray-300">
                  What motivates you to join our team? <span className="text-red-500">*</span>
                </label>
                <motion.textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  rows="5"
                  placeholder="I'm excited about the opportunity because..."
                  whileFocus={{ 
                    scale: 1.01,
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                  }}
                />
                {errors.motivation && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.motivation}
                  </motion.p>
                )}
              </motion.div>

              {/* Portfolio */}
              <motion.div 
                variants={itemVariants}
                whileHover={cardHover}
              >
                <label htmlFor="portfolio" className="block text-sm font-medium mb-3 text-gray-300">
                  Portfolio/LinkedIn Profile (URL) <span className="text-red-500">*</span>
                </label>
                <motion.input
                  type="url"
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  placeholder="https://linkedin.com/in/yourprofile"
                  whileFocus={{ 
                    scale: 1.01,
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                  }}
                />
                {errors.portfolio && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.portfolio}
                  </motion.p>
                )}
              </motion.div>

              {/* CV Upload */}
              <motion.div 
                variants={itemVariants}
                whileHover={cardHover}
              >
                <label htmlFor="cv" className="block text-sm font-medium mb-3 text-gray-300">
                  Upload CV/Resume (PDF/DOCX, max 5MB) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <motion.label
                    htmlFor="cv"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-700 hover:bg-gray-600 transition duration-300"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-10 h-10 mb-4 text-gray-400" />
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
                  </motion.label>
                </div>
                {fileName && (
                  <motion.p 
                    className="mt-3 text-sm text-gray-300 flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FiCheckCircle className="text-green-500 mr-2" /> {fileName}
                  </motion.p>
                )}
                {errors.cv && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.cv}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div 
                variants={itemVariants} 
                className="pt-6"
              >
                <motion.button
                  type="button"
                  onClick={handlePreview}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-300 shadow-lg hover:shadow-blue-500/20 relative overflow-hidden"
                  whileHover={{ 
                    scale: 1.01,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="relative z-10">Preview Application</span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition duration-300"
                    style={{ mixBlendMode: "overlay" }}
                  />
                </motion.button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
      </motion.div>

      {/* Preview Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-80 z-50 backdrop-blur-sm">
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <motion.h2 
                    className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Application Preview
                  </motion.h2>
                  <motion.button
                    onClick={closePopup}
                    className="text-gray-400 hover:text-white transition duration-200"
                    disabled={isSubmitting}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-7 h-7" />
                  </motion.button>
                </div>

                {submitSuccess ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500 mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FiCheckCircle className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-medium text-white mb-3">
                      Application Submitted!
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Thank you for your application. We'll review it and get back to you soon.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {[
                        { label: "Full Name", value: formData.name },
                        { label: "Age", value: formData.age },
                        { label: "Phone", value: formData.phone },
                        { label: "Role", value: formData.role },
                        { label: "Experience", value: formData.experience },
                        { 
                          label: "Portfolio", 
                          value: formData.portfolio,
                          isLink: true 
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="bg-gray-700 bg-opacity-50 p-5 rounded-lg"
                        >
                          <h3 className="text-sm font-medium text-gray-400 mb-2">{item.label}</h3>
                          {item.isLink ? (
                            <a
                              href={item.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center"
                            >
                              {item.value} <FiExternalLink className="ml-1" />
                            </a>
                          ) : (
                            <p className="text-white">{item.value}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <motion.div 
                      className="mb-8 bg-gray-700 bg-opacity-50 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Motivation</h3>
                      <p className="text-white whitespace-pre-line">{formData.motivation}</p>
                    </motion.div>

                    <motion.div 
                      className="mb-8 bg-gray-700 bg-opacity-50 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <h3 className="text-sm font-medium text-gray-400 mb-2">CV/Resume</h3>
                      <p className="text-white flex items-center">
                        <FiCheckCircle className="text-green-500 mr-2" /> {formData.cv?.name}
                      </p>
                    </motion.div>

                    {errors.submit && (
                      <motion.div 
                        className="mb-6 p-4 bg-red-900 bg-opacity-30 rounded-lg text-red-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.submit}
                      </motion.div>
                    )}

                    <div className="flex justify-end space-x-4 pt-2">
                      <motion.button
                        onClick={closePopup}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition duration-200 flex items-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={sendEmail}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center relative overflow-hidden"
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">Submit Application</span>
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition duration-300"
                              style={{ mixBlendMode: "overlay" }}
                            />
                          </>
                        )}
                      </motion.button>
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