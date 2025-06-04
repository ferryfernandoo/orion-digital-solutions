import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const productData = [	{
		id: 'desktop-os',
		title: 'Orion Desktop Experience',
		subtitle: 'Modern Desktop Operating System',
		description:
			'A powerful web-based desktop environment that provides a familiar and intuitive computing experience.',
		features: [
			'Windows-like Desktop Interface',
			'Multi-window Management',
			'App Ecosystem',
			'Cloud Integration',
			'Modern UI/UX',
		],
		color: 'from-indigo-500 to-blue-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		id: 'mobile-os',
		title: 'Orion Mobile Experience',
		subtitle: 'Mobile-First Operating System',
		description:
			'An elegant and efficient mobile operating system interface that offers seamless mobile computing in your browser.',
		features: [
			'Modern Mobile Interface',
			'Quick Settings Panel',
			'App Grid Layout',
			'Smooth Animations',
			'Touch Optimized',
		],
		color: 'from-blue-500 to-cyan-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		id: 'robotics',
		title: 'Orion Robotics',
		subtitle: 'Next-Generation Automation Solutions',
		description:
			'Advanced robotics systems powered by AI for industrial automation, healthcare, and smart manufacturing.',
		features: [
			'Autonomous Navigation Systems',
			'Computer Vision Integration',
			'Predictive Maintenance AI',
			'Real-time Process Optimization',
			'Human-Robot Collaboration Interface',
		],
		color: 'from-blue-500 to-cyan-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		id: 'communication',
		title: 'Orion Communication',
		subtitle: 'Unified Enterprise Communications',
		description:
			'Secure, scalable communication platforms that integrate AI-powered analytics and real-time collaboration tools.',
		features: [
			'AI-Powered Voice Analytics',
			'Secure Video Conferencing',
			'Smart Message Routing',
			'Automated Translation',
			'Sentiment Analysis',
		],
		color: 'from-purple-500 to-pink-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
		),
	},
	{
		id: 'education',
		title: 'Orion Education',
		subtitle: 'AI-Powered Learning Platform',
		description:
			'Comprehensive educational technology solutions that personalize learning experiences and optimize educational outcomes.',
		features: [
			'Adaptive Learning Paths',
			'Real-time Progress Analytics',
			'Interactive Virtual Labs',
			'AI Teaching Assistant',
			'Collaborative Learning Tools',
		],
		color: 'from-green-500 to-teal-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path d="M12 14l9-5-9-5-9 5 9 5z" />
				<path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M12 14l9-5-9-5-9 5 9 5z"
				/>
			</svg>
		),
	},
	{
		id: 'business',
		title: 'Orion Business Platform',
		subtitle: 'Enterprise Solutions Suite',
		description:
			'Integrated business management platform with AI-driven insights, automation, and enterprise-grade security.',
		features: [
			'Predictive Analytics',
			'Automated Workflows',
			'Resource Optimization',
			'Compliance Management',
			'Performance Monitoring',
		],
		color: 'from-orange-500 to-yellow-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		id: 'imagination',
		title: 'Orion Unlimited Imagination',
		subtitle: 'Creative AI Solutions',
		description:
			'Pushing the boundaries of AI innovation with cutting-edge research and creative applications.',
		features: [
			'Generative AI Models',
			'Creative Content Generation',
			'Virtual Reality Integration',
			'Emotion Recognition',
			'Cognitive Computing',
		],
		color: 'from-red-500 to-rose-500',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
				/>
			</svg>
		),
	},
];

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: [0.4, 0, 0.2, 1],
		},
	},
};

const Products = () => {
	const [selectedProduct, setSelectedProduct] = useState(null);
	const navigate = useNavigate();

	const handleProductClick = (product) => {
		if (product.id === 'desktop-os') {
			navigate('/desktop-os');
		} else if (product.id === 'mobile-os') {
			navigate('/mobile-os');
		} else {
			setSelectedProduct(product);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white pt-20 pb-12 px-4">
			<motion.div
				className="max-w-7xl mx-auto"
				initial="hidden"
				animate="visible"
				variants={containerVariants}
			>
				{/* Header */}
				<motion.div className="text-center mb-16" variants={itemVariants}>
					<h1 className="text-4xl md:text-6xl font-bold mb-6">
						<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
							Our Products
						</span>
					</h1>
					<p className="text-xl text-gray-300 max-w-3xl mx-auto">
						Discover our suite of innovative AI solutions designed to transform
						industries and empower businesses for the digital age.
					</p>
				</motion.div>

				{/* Products Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{productData.map((product) => (
						<motion.div
							key={product.id}
							className="relative group"
							variants={itemVariants}
							whileHover={{ y: -8 }}
							onClick={() => handleProductClick(product)}
						>
							<div className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 h-full cursor-pointer transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/20">
								<div
									className={`bg-gradient-to-r ${product.color} p-4 rounded-lg w-fit mb-6`}
								>
									{product.icon}
								</div>
								<h3 className="text-2xl font-bold mb-2">{product.title}</h3>
								<p className="text-blue-400 mb-4">{product.subtitle}</p>
								<p className="text-gray-400 mb-6">{product.description}</p>
								{(product.id === 'desktop-os' || product.id === 'mobile-os') && (
									<div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
										Try Demo &rarr;
									</div>
								)}
								<motion.div
									className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
									whileHover={{ scale: 1.1 }}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-6 w-6 text-blue-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M14 5l7 7m0 0l-7 7m7-7H3"
										/>
									</svg>
								</motion.div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Product Modal */}
				<AnimatePresence>
					{selectedProduct && (
						<motion.div
							className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setSelectedProduct(null)}
						>
							<motion.div
								className="glass p-8 rounded-xl max-w-2xl w-full"
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
							>
								<div
									className={`bg-gradient-to-r ${selectedProduct.color} p-4 rounded-lg w-fit mb-6`}
								>
									{selectedProduct.icon}
								</div>
								<h2 className="text-3xl font-bold mb-2">
									{selectedProduct.title}
								</h2>
								<p className="text-blue-400 mb-4">
									{selectedProduct.subtitle}
								</p>
								<p className="text-gray-300 mb-6">
									{selectedProduct.description}
								</p>
								<h3 className="text-xl font-semibold mb-4">Key Features</h3>
								<ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{selectedProduct.features.map((feature, index) => (
										<motion.li
											key={index}
											className="flex items-center gap-2 text-gray-300"
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<svg
												className="h-5 w-5 text-blue-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
											{feature}
										</motion.li>
									))}
								</ul>
								<div className="mt-8 flex justify-end gap-4">
									<motion.button
										className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											if (selectedProduct.id === 'desktop-os') {
												navigate('/desktop-os');
											} else if (selectedProduct.id === 'mobile-os') {
												navigate('/mobile-os');
											} else {
												navigate('/contact');
											}
										}}
									>
										{selectedProduct.id === 'desktop-os' || selectedProduct.id === 'mobile-os'
											? 'Try Demo'
											: 'Learn More'}
									</motion.button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
};

export default Products;
