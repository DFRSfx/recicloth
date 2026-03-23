import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SlideData {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;    // lg — 1920×1080
  backgroundImageMd: string;  // md — 1280×720
  backgroundImageSm: string;  // sm — 800×450
  textColor?: 'white' | 'dark';
}

const HeroSlider: React.FC = () => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const API_BASE = `${SERVER_URL}/api`;
        const response = await fetch(`${API_BASE}/hero-slides`);
        if (response.ok) {
          const data = await response.json();
          // Transform API data to component format
          const transformedSlides = data.map((slide: any) => ({
            id: slide.id,
            title: slide.title,
            description: slide.description || '',
            buttonText: slide.button_text,
            buttonLink: slide.button_link,
            backgroundImage:   `${SERVER_URL}${slide.background_image}`,
            backgroundImageMd: `${SERVER_URL}${slide.background_image_md}`,
            backgroundImageSm: `${SERVER_URL}${slide.background_image_sm}`,
            textColor: slide.text_color || 'white'
          }));

          // Preload first slide image to prevent layout shift
          if (transformedSlides.length > 0) {
            const img = new Image();
            img.onload = () => {
              setSlides(transformedSlides);
              setLoading(false);
            };
            img.onerror = () => {
              // Even if image fails, show slides
              setSlides(transformedSlides);
              setLoading(false);
            };
            img.src = transformedSlides[0].backgroundImage;
          } else {
            setSlides(transformedSlides);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;

    // Add resistance at boundaries
    if ((currentSlide === 0 && diff > 0) || (currentSlide === slides.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.2);
    } else {
      setDragOffset(diff);
    }

    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const distance = touchStart - touchEnd;
    const threshold = 50;

    if (distance > threshold && currentSlide < slides.length - 1) {
      goToNext();
    } else if (distance < -threshold && currentSlide > 0) {
      goToPrevious();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
    setIsAutoPlaying(true);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setIsDragging(true);
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart) return;

    const diff = e.clientX - touchStart;

    // Add resistance at boundaries
    if ((currentSlide === 0 && diff > 0) || (currentSlide === slides.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.2);
    } else {
      setDragOffset(diff);
    }

    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const distance = touchStart - touchEnd;
    const threshold = 50;

    if (distance > threshold && currentSlide < slides.length - 1) {
      goToNext();
    } else if (distance < -threshold && currentSlide > 0) {
      goToPrevious();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
    setIsAutoPlaying(true);
  };

  // If no slides and still loading, show loading state with skeleton
  if (loading || slides.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">A carregar slides...</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative h-[70vh] md:h-[80vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides Container */}
      <div
        className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) {
            handleMouseUp();
          }
          handleMouseLeave();
        }}
      >
        <div
          className="w-full h-full flex"
          style={{
            transform: `translateX(calc(${-currentSlide * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {slides.map((slide, index) => {
            const isImageLoaded = imagesLoaded.has(index);
            return (
            <div
              key={slide.id}
              className="w-full h-full flex-shrink-0 relative"
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-gray-200">
                {/* Skeleton loader while image loads */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
                )}

                <picture>
                  <source media="(max-width: 768px)"  srcSet={slide.backgroundImageSm} />
                  <source media="(max-width: 1280px)" srcSet={slide.backgroundImageMd} />
                  <img
                    src={slide.backgroundImage}
                    alt={slide.title}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      isImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => {
                      setImagesLoaded(prev => new Set(prev).add(index));
                    }}
                    loading="eager"
                    fetchpriority={index === 0 ? 'high' : 'auto'}
                  />
                </picture>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <h1
                    className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 ${
                      slide.textColor === 'white' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {slide.title}
                  </h1>
                  <p 
                    className={`text-lg md:text-xl mb-8 leading-relaxed ${
                      slide.textColor === 'white' ? 'text-gray-100' : 'text-gray-600'
                    }`}
                  >
                    {slide.description}
                  </p>
                  <Link
                    to={slide.buttonLink}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 relative overflow-hidden group"
                  >
                    <span className="relative z-10">{slide.buttonText}</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="absolute inset-0 bg-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </div>
              </div>
            </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3 bg-black bg-opacity-20 backdrop-blur-sm px-4 py-3 rounded-full">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 hover:scale-125 ${
              index === currentSlide
                ? 'w-8 h-3 bg-primary-600 shadow-lg'
                : 'w-3 h-3 bg-white bg-opacity-60 hover:bg-opacity-90 hover:bg-primary-400'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-20 z-20">
        <div
          className="h-full bg-primary-600 transition-all duration-300 ease-linear"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
};

export default HeroSlider;