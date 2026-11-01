import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import QRCodeStyling from 'qr-code-styling'
import {
  ArrowLeft,
  Globe,
  Sparkles,
  Layout,
  Check,
  CheckCircle2,
  Square,
  Circle,
  Diamond,
  Heart,
  Plus as PlusIcon,
  X as CrossIcon,
  Star,
  Triangle,
  Menu,
  Shield,
  Info,
  Upload,
  Cloud,
  MessageCircle,
  Droplet,
  Home,
  Building,
  Store,
  Truck,
  Fuel,
  Factory,
  Utensils,
  Coffee,
  ShoppingBag,
  ShoppingCart,
  Gift,
  Tag as TagIcon,
  Ticket,
  Book,
  GraduationCap,
  User,
  Smartphone,
  Laptop,
  Camera,
  Watch,
  Clock,
  Lightbulb,
  Key,
  Briefcase,
  Dumbbell,
  ThumbsUp,
  Gavel,
  Zap,
  Wrench,
  Trash2,
  Shirt,
  Trophy,
  Settings as GearIcon,
  Umbrella,
  Sun,
  Trees,
  Box,
} from 'lucide-react'
import {
  getQrCodes,
  getLinks,
  updateQrCode,
  updateLink,
  addLink,
} from '../lib/api'

// 9 Templates matching screenshots exactly
const TEMPLATES = [
  {
    id: 'brand',
    name: 'Brand',
    color: '#0284c7',
    pattern: 'dots',
    cornerFrame: 'rounded',
    cornerDot: 'circle',
    ctaFrame: 'none',
    ctaText: 'Visit our website',
  },
  {
    id: 'brand-frame',
    name: 'Brand frame',
    color: '#0284c7',
    pattern: 'dots',
    cornerFrame: 'rounded',
    cornerDot: 'circle',
    ctaFrame: 'bottom-banner',
    ctaText: 'Visit our website',
  },
  {
    id: 'brand-leaf',
    name: 'Brand leaf',
    color: '#06b6d4',
    pattern: 'rounded',
    cornerFrame: 'leaf',
    cornerDot: 'leaf',
    ctaFrame: 'bottom-banner',
    ctaText: 'Scan me',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    color: '#1d4ed8',
    pattern: 'dots',
    cornerFrame: 'circle',
    cornerDot: 'circle',
    ctaFrame: 'none',
    ctaText: 'Visit our website',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    color: '#9f1239',
    pattern: 'dots',
    cornerFrame: 'rounded',
    cornerDot: 'circle',
    ctaFrame: 'bottom-banner',
    ctaText: 'Visit our website',
  },
  {
    id: 'royal',
    name: 'Royal',
    color: '#9333ea',
    pattern: 'rounded',
    cornerFrame: 'octagon',
    cornerDot: 'diamond',
    ctaFrame: 'bottom-banner',
    ctaText: 'Visit our website',
  },
  {
    id: 'forest',
    name: 'Forest',
    color: '#15803d',
    pattern: 'dots',
    cornerFrame: 'leaf',
    cornerDot: 'circle',
    ctaFrame: 'bottom-banner',
    ctaText: 'Scan me',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    color: '#0f172a',
    pattern: 'small-squares',
    cornerFrame: 'square',
    cornerDot: 'square',
    ctaFrame: 'bottom-banner',
    ctaText: 'Scan me',
  },
  {
    id: 'rose',
    name: 'Rose',
    color: '#be123c',
    pattern: 'diamond',
    cornerFrame: 'rounded',
    cornerDot: 'diamond',
    ctaFrame: 'bottom-banner',
    ctaText: 'Visit our website',
  },
]

// 14 Pattern styles matching screenshot 1
const PATTERNS = [
  { id: 'square',        label: 'Square',         icon: Square,     dotType: 'square' },
  { id: 'fluid',         label: 'Fluid',          icon: Circle,     dotType: 'rounded' },
  { id: 'rounded',       label: 'Rounded',        icon: Circle,     dotType: 'rounded' },
  { id: 'dots',          label: 'Dots',           icon: Circle,     dotType: 'dots' },
  { id: 'small-squares', label: 'Small squares',  icon: Square,     dotType: 'classy' },
  { id: 'diamond',       label: 'Diamond',        icon: Diamond,    dotType: 'extra-rounded' },
  { id: 'star',          label: 'Star',           icon: Star,       dotType: 'classy-rounded' },
  { id: 'triangle',      label: 'Triangle',       icon: Triangle,   dotType: 'classy' },
  { id: 'plus',          label: 'Plus',           icon: PlusIcon,   dotType: 'square' },
  { id: 'cross',         label: 'Cross',          icon: CrossIcon,  dotType: 'square' },
  { id: 'heart',         label: 'Heart',          icon: Heart,      dotType: 'rounded' },
  { id: 'leaf',          label: 'Leaf',           icon: Sparkles,   dotType: 'classy' },
  { id: 'vertical-bars', label: 'Vertical bars',  icon: Menu,       dotType: 'square' },
  { id: 'horizontal-bars', label: 'Horizontal bars', icon: Menu,   dotType: 'square' },
]

// Corner frames matching screenshot 2
const CORNER_FRAMES = [
  { id: 'square',        label: 'Square',        type: 'square' },
  { id: 'rounded',       label: 'Rounded',       type: 'extra-rounded' },
  { id: 'extra-rounded', label: 'Extra Rounded', type: 'extra-rounded' },
  { id: 'circle',        label: 'Circle',        type: 'dot' },
  { id: 'leaf',          label: 'Leaf',          type: 'extra-rounded' },
  { id: 'octagon',       label: 'Octagon',       type: 'dot' },
]

// Corner dots matching screenshot 2
const CORNER_DOTS = [
  { id: 'square',  label: 'Square',  type: 'square' },
  { id: 'rounded', label: 'Rounded', type: 'dot' },
  { id: 'circle',  label: 'Circle',  type: 'dot' },
  { id: 'diamond', label: 'Diamond', type: 'dot' },
  { id: 'star',    label: 'Star',    type: 'dot' },
  { id: 'leaf',    label: 'Leaf',    type: 'dot' },
]

// Color swatches from screenshot 3
const COLOR_SWATCHES = [
  '#111111', '#0284c7', '#0f172a', '#1e40af', '#881337', '#15803d', '#6b21a8', '#c2410c'
]

// 80 Shapes matching screenshots
const SHAPES_DATA = [
  // Row 1
  { id: 'none', label: 'None', icon: Square, mask: 'none' },
  { id: 'circle', label: 'Circle', icon: Circle, mask: 'circle(48% at 50% 50%)' },
  { id: 'heart', label: 'Heart', icon: Heart, mask: 'polygon(50% 15%, 80% 0%, 100% 25%, 100% 55%, 50% 95%, 0% 55%, 0% 25%, 20% 0%)' },
  { id: 'star', label: 'Star', icon: Star, mask: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { id: 'cloud', label: 'Cloud', icon: Cloud, mask: 'circle(45% at 50% 50%)' },
  { id: 'bubble', label: 'Bubble', icon: MessageCircle, mask: 'circle(46% at 50% 50%)' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, mask: 'circle(46% at 50% 50%)' },
  { id: 'drop', label: 'Drop', icon: Droplet, mask: 'polygon(50% 0%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%)' },

  // Row 2
  { id: 'hexagon', label: 'Hexagon', icon: Shield, mask: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' },
  { id: 'shield', label: 'Shield', icon: Shield, mask: 'polygon(50% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%, 0% 0%)' },
  { id: 'badge', label: 'Badge', icon: Sparkles, mask: 'polygon(50% 0%, 65% 15%, 85% 15%, 85% 35%, 100% 50%, 85% 65%, 85% 85%, 65% 85%, 50% 100%, 35% 85%, 15% 85%, 15% 65%, 0% 50%, 15% 35%, 15% 15%, 35% 15%)' },
  { id: 'house', label: 'House', icon: Home, mask: 'polygon(50% 0%, 100% 40%, 85% 40%, 85% 100%, 15% 100%, 15% 40%, 0% 40%)' },
  { id: 'real-estate', label: 'Real estate', icon: Home, mask: 'polygon(50% 0%, 100% 40%, 85% 40%, 85% 100%, 15% 100%, 15% 40%, 0% 40%)' },
  { id: 'building', label: 'Building', icon: Building, mask: 'none' },
  { id: 'store', label: 'Store', icon: Store, mask: 'none' },
  { id: 'logistics', label: 'Logistics', icon: Truck, mask: 'none' },

  // Row 3
  { id: 'gas-station', label: 'Gas station', icon: Fuel, mask: 'none' },
  { id: 'factory', label: 'Factory', icon: Factory, mask: 'none' },
  { id: 'barn', label: 'Barn', icon: Home, mask: 'none' },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils, mask: 'none' },
  { id: 'cloche', label: 'Cloche', icon: Utensils, mask: 'none' },
  { id: 'burger', label: 'Burger', icon: Utensils, mask: 'none' },
  { id: 'pizza', label: 'Pizza', icon: Utensils, mask: 'none' },
  { id: 'pizza-slice', label: 'Pizza slice', icon: Triangle, mask: 'none' },

  // Row 4
  { id: 'bread', label: 'Bread', icon: Utensils, mask: 'none' },
  { id: 'cake', label: 'Cake', icon: Utensils, mask: 'none' },
  { id: 'ice-cream', label: 'Ice cream', icon: Sparkles, mask: 'none' },
  { id: 'chef', label: 'Chef', icon: Utensils, mask: 'none' },
  { id: 'apple', label: 'Apple', icon: Heart, mask: 'none' },
  { id: 'mug', label: 'Mug', icon: Coffee, mask: 'none' },
  { id: 'cup', label: 'Cup', icon: Coffee, mask: 'none' },
  { id: 'glass', label: 'Glass', icon: Coffee, mask: 'none' },

  // Row 5
  { id: 'pot', label: 'Pot', icon: Utensils, mask: 'none' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, mask: 'none' },
  { id: 'shopping-bag', label: 'Shopping bag', icon: ShoppingBag, mask: 'none' },
  { id: 'gift', label: 'Gift', icon: Gift, mask: 'none' },
  { id: 'tag', label: 'Tag', icon: TagIcon, mask: 'none' },
  { id: 'ticket', label: 'Ticket', icon: Ticket, mask: 'none' },
  { id: 'book', label: 'Book', icon: Book, mask: 'none' },
  { id: 'education', label: 'Education', icon: GraduationCap, mask: 'none' },

  // Row 6
  { id: 'person', label: 'Person', icon: User, mask: 'none' },
  { id: 'phone', label: 'Phone', icon: Smartphone, mask: 'none' },
  { id: 'laptop', label: 'Laptop', icon: Laptop, mask: 'none' },
  { id: 'camera', label: 'Camera', icon: Camera, mask: 'none' },
  { id: 'watch', label: 'Watch', icon: Watch, mask: 'none' },
  { id: 'wall-clock', label: 'Wall clock', icon: Clock, mask: 'none' },
  { id: 'light-bulb', label: 'Light bulb', icon: Lightbulb, mask: 'none' },
  { id: 'key', label: 'Key', icon: Key, mask: 'none' },

  // Row 7
  { id: 'tractor', label: 'Tractor', icon: Truck, mask: 'none' },
  { id: 'travel', label: 'Travel', icon: Globe, mask: 'none' },
  { id: 'suitcase', label: 'Suitcase', icon: Briefcase, mask: 'none' },
  { id: 'salon', label: 'Salon', icon: Sparkles, mask: 'none' },
  { id: 'gym', label: 'Gym', icon: Dumbbell, mask: 'none' },
  { id: 'like-us', label: 'Like us', icon: ThumbsUp, mask: 'none' },
  { id: 'gavel', label: 'Gavel', icon: Gavel, mask: 'none' },
  { id: 'electrician', label: 'Electrician', icon: Zap, mask: 'none' },

  // Row 8
  { id: 'construction', label: 'Construction', icon: Wrench, mask: 'none' },
  { id: 'pest-control', label: 'Pest control', icon: Sparkles, mask: 'none' },
  { id: 'plumber', label: 'Plumber', icon: Wrench, mask: 'none' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, mask: 'none' },
  { id: 'spray-bottle', label: 'Spray bottle', icon: Droplet, mask: 'none' },
  { id: 'bucket', label: 'Bucket', icon: Trash2, mask: 'none' },
  { id: 'bin', label: 'Bin', icon: Trash2, mask: 'none' },
  { id: 'tooth', label: 'Tooth', icon: Shield, mask: 'none' },

  // Row 9
  { id: 't-shirt', label: 'T-shirt', icon: Shirt, mask: 'none' },
  { id: 'sneaker', label: 'Sneaker', icon: Sparkles, mask: 'none' },
  { id: 'trophy', label: 'Trophy', icon: Trophy, mask: 'none' },
  { id: 'gear', label: 'Gear', icon: GearIcon, mask: 'none' },
  { id: 'armchair', label: 'Armchair', icon: Home, mask: 'none' },
  { id: 'umbrella', label: 'Umbrella', icon: Umbrella, mask: 'none' },
  { id: 'sunrise', label: 'Sunrise', icon: Sun, mask: 'none' },
  { id: 'paw', label: 'Paw', icon: Heart, mask: 'none' },

  // Row 10
  { id: 'dog', label: 'Dog', icon: Heart, mask: 'none' },
  { id: 'cat', label: 'Cat', icon: Heart, mask: 'none' },
  { id: 'poultry', label: 'Poultry', icon: Sparkles, mask: 'none' },
  { id: 'bear', label: 'Bear', icon: Heart, mask: 'none' },
  { id: 'tree', label: 'Tree', icon: Trees, mask: 'none' },
  { id: 'gardening', label: 'Gardening', icon: Trees, mask: 'none' },
  { id: 'ice-cube', label: 'Ice cube', icon: Box, mask: 'none' },
  { id: 'ice-cubes', label: 'Ice cubes', icon: Box, mask: 'none' },
]

export default function EditQR() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qrCodeRef = useRef(null)
  const qrInstanceRef = useRef(null)

  const [qr, setQr] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Content state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [qrName, setQrName] = useState('')
  const [splashScreen, setSplashScreen] = useState(false)
  const [popupAdvert, setPopupAdvert] = useState(false)

  // Design state (Defaults match Brand)
  const [selectedTemplate, setSelectedTemplate] = useState('brand')
  const [activeTab, setActiveTab] = useState('pattern')
  const [patternStyle, setPatternStyle] = useState('small-squares')
  const [whiteBorder, setWhiteBorder] = useState(2)
  const [damageResistance, setDamageResistance] = useState('high')

  // Corners state
  const [cornerFrame, setCornerFrame] = useState('rounded')
  const [cornerDot, setCornerDot] = useState('circle')

  // Colors state
  const [patternFillType, setPatternFillType] = useState('solid')
  const [patternColor, setPatternColor] = useState('#0284c7')
  const [cornerFrameColor, setCornerFrameColor] = useState('#0284c7')
  const [cornerDotColor, setCornerDotColor] = useState('#0284c7')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparentBg, setTransparentBg] = useState(false)

  // Logo state: By default NO LOGO in center (user explicitly requested: "QR ke central se log hata do")
  const [uploadedLogo, setUploadedLogo] = useState('')
  const [showCenterLogo, setShowCenterLogo] = useState(false)
  const [logoSize, setLogoSize] = useState(30)
  const [whiteSpaceBehindLogo, setWhiteSpaceBehindLogo] = useState(true)

  // Frame and CTA state (Matches Screenshot 2, 3, 4, 5)
  const [ctaFrame, setCtaFrame] = useState('none')
  const [ctaText, setCtaText] = useState('Visit our website')

  // Shape state
  const [selectedShape, setSelectedShape] = useState('none')
  const [outlineColor, setOutlineColor] = useState('#0284c7')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const qrs = await getQrCodes()
      const found = id ? qrs.find(q => q.id === id) : qrs[0]
      if (found) {
        setQr(found)
        setQrName(found.name)
        const l = await getLinks(found.id)
        setLinks(l || [])
        const active = l?.find(item => item.is_active)
        if (active) {
          setWebsiteUrl(active.url)
        } else if (l && l.length > 0) {
          setWebsiteUrl(l[0].url)
        } else {
          setWebsiteUrl('https://example.com')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Real-Time Dynamic QR Code Rendering via qr-code-styling ───
  useEffect(() => {
    if (!qr || !qrCodeRef.current) return

    const activePat = PATTERNS.find(p => p.id === patternStyle) || PATTERNS[0]
    const activeCF = CORNER_FRAMES.find(c => c.id === cornerFrame) || CORNER_FRAMES[0]
    const activeCD = CORNER_DOTS.find(c => c.id === cornerDot) || CORNER_DOTS[0]

    const redirectUrl = qr.redirect_url || `http://localhost:8000/go/${qr.slug}`

    const qrOptions = {
      width: 240,
      height: 240,
      type: 'svg',
      data: redirectUrl,
      margin: 0,
      qrOptions: {
        errorCorrectionLevel: damageResistance === 'highest' ? 'H' : damageResistance === 'high' ? 'Q' : 'M',
      },
      dotsOptions: {
        color: patternColor,
        type: activePat.dotType,
      },
      cornersSquareOptions: {
        color: cornerFrameColor,
        type: activeCF.type,
      },
      cornersDotOptions: {
        color: cornerDotColor,
        type: activeCD.type,
      },
      backgroundOptions: {
        color: transparentBg ? 'transparent' : bgColor,
      },
      image: (showCenterLogo && uploadedLogo) ? uploadedLogo : '',
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.3,
        margin: whiteSpaceBehindLogo ? 4 : 0,
      },
    }

    try {
      const qrCode = new QRCodeStyling(qrOptions)
      qrCodeRef.current.innerHTML = ''
      qrCode.append(qrCodeRef.current)
    } catch (err) {
      console.error('QRCodeStyling error:', err)
    }
  }, [
    qr,
    loading,
    patternStyle,
    cornerFrame,
    cornerDot,
    patternColor,
    cornerFrameColor,
    cornerDotColor,
    bgColor,
    transparentBg,
    damageResistance,
    showCenterLogo,
    uploadedLogo,
    whiteSpaceBehindLogo,
  ])


  // Template Click Handler (Updates all design parameters in real-time)
  function handleSelectTemplate(tpl) {
    setSelectedTemplate(tpl.id)
    setPatternColor(tpl.color)
    setCornerFrameColor(tpl.color)
    setCornerDotColor(tpl.color)
    setOutlineColor(tpl.color)
    setPatternStyle(tpl.pattern)
    setCornerFrame(tpl.cornerFrame)
    setCornerDot(tpl.cornerDot)
    setCtaFrame(tpl.ctaFrame)
    setCtaText(tpl.ctaText)
    // Keep center logo off
    setShowCenterLogo(false)
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => {
        setUploadedLogo(ev.target.result)
        setShowCenterLogo(true)
        showToast('Logo applied to QR code!')
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSaveChanges() {
    if (!qr) return
    setSaving(true)
    try {
      // 1. Update QR Name if changed
      if (qrName.trim() && qrName !== qr.name) {
        await updateQrCode(qr.id, qrName.trim())
      }

      // 2. Update Destination URL
      const cleanUrl = websiteUrl.trim()
      const active = links.find(l => l.is_active)
      if (active) {
        await updateLink(qr.id, active.id, { url: cleanUrl })
      } else if (links.length > 0) {
        await updateLink(qr.id, links[0].id, { url: cleanUrl })
      } else {
        await addLink(qr.id, { title: 'Website URL', url: cleanUrl })
      }

      showToast('Changes saved! Live on next scan ✨')
      setTimeout(() => {
        navigate(`/qr/${qr.id}`)
      }, 1000)
    } catch (err) {
      console.error(err)
      showToast('Error saving changes. Check destination URL.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="edit-qr-page flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!qr) {
    return (
      <div className="edit-qr-page" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>QR Code not found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const activeShapeObj = SHAPES_DATA.find(s => s.id === selectedShape) || SHAPES_DATA[0]

  return (
    <div className="edit-qr-page edit-qr-dark-theme">
      {/* Toast Feedback */}
      {toast && (
        <div className="impr-toast-banner-dark">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Back Nav Button */}
      <div className="edit-qr-top-nav">
        <Link to={`/qr/${qr.id}`} className="btn-back-to-code-dark">
          <ArrowLeft size={16} />
          <span>Back to code</span>
        </Link>
      </div>

      {/* Title Header */}
      <div className="edit-qr-header">
        <div className="edit-qr-header-icon-dark">
          <Globe size={22} />
        </div>
        <div>
          <h1 className="edit-qr-title-dark">Edit {qr.name}</h1>
          <p className="edit-qr-subtitle-dark">Open any web page</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="edit-qr-layout-grid">
        {/* ─── LEFT COLUMN: Configuration Sections ─── */}
        <div className="edit-qr-left-column">
          {/* Section 1: Content */}
          <div className="edit-card-panel-dark">
            <div className="section-title-badge">
              <span className="step-number-circle">1</span>
              <h2>Content</h2>
            </div>

            <div className="form-field-group">
              <label className="field-sublabel-dark">Website address <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="url"
                placeholder="https://example.com/menu"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                className="edit-input-field-dark"
                required
              />
            </div>
          </div>

          {/* Splash screen and pop-up */}
          <div className="edit-card-panel-dark">
            <div className="flex items-center gap-2" style={{ marginBottom: '0.4rem' }}>
              <Layout size={18} color="#e11d48" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Splash screen and pop-up
              </h3>
            </div>
            <p className="field-helper-desc-dark">
              For smart codes: visitors see these on a short page, then continue to your link by themselves.
            </p>

            <div className="toggles-container">
              <label className="switch-toggle-row-dark">
                <input
                  type="checkbox"
                  checked={splashScreen}
                  onChange={e => setSplashScreen(e.target.checked)}
                />
                <span className="slider-switch" />
                <span>Splash screen when the page opens</span>
              </label>

              <label className="switch-toggle-row-dark" style={{ marginTop: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={popupAdvert}
                  onChange={e => setPopupAdvert(e.target.checked)}
                />
                <span className="slider-switch" />
                <span>Pop-up advert with a Skip button</span>
              </label>
            </div>
          </div>

          {/* Info Banner */}
          <div className="smart-code-info-pill-dark">
            <Sparkles size={16} className="sparkle-cyan" />
            <span>Smart code: content changes go live on the next scan, no reprint needed.</span>
          </div>

          {/* Section 2: Design */}
          <div className="edit-card-panel-dark">
            <div className="section-title-badge">
              <span className="step-number-circle">2</span>
              <h2>Design</h2>
            </div>

            {/* Templates Selector (Updates Live Preview Instantly) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="field-sublabel-dark">Templates</label>
              <div className="templates-scroll-row">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`template-preview-btn-dark ${selectedTemplate === tpl.id ? 'active' : ''}`}
                    onClick={() => handleSelectTemplate(tpl)}
                  >
                    <div className="tpl-mini-qr-dark" style={{ borderColor: tpl.color }}>
                      <div className="tpl-mini-dot" style={{ background: tpl.color }} />
                    </div>
                    <span className="tpl-name-dark">{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Sub-Tabs Bar */}
            <div className="design-tabs-bar-dark">
              {['pattern', 'corners', 'colors', 'logo', 'frame', 'shape'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`design-tab-btn-dark ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'frame' ? 'Frame and CTA' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* ─── TAB 1: Pattern Style (Screenshot 1) ─── */}
            {activeTab === 'pattern' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Pattern style</label>
                <div className="pattern-styles-grid">
                  {PATTERNS.map(pat => {
                    const IconComponent = pat.icon
                    const isSelected = patternStyle === pat.id
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        className={`pattern-style-card-dark ${isSelected ? 'active' : ''}`}
                        onClick={() => setPatternStyle(pat.id)}
                      >
                        <div className="pattern-icon-wrap-dark">
                          <IconComponent size={20} />
                        </div>
                        <span className="pattern-title-dark">{pat.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginTop: '1.5rem' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="field-sublabel-dark">White border: {whiteBorder}</label>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={whiteBorder}
                      onChange={e => setWhiteBorder(+e.target.value)}
                      className="range-slider-cyan"
                    />
                  </div>

                  <div style={{ width: 220 }}>
                    <label className="field-sublabel-dark">Damage resistance</label>
                    <select
                      value={damageResistance}
                      onChange={e => setDamageResistance(e.target.value)}
                      className="edit-select-field-dark"
                    >
                      <option value="high">High (25%)</option>
                      <option value="highest">Highest (30%), used with logos</option>
                      <option value="medium">Medium (15%)</option>
                      <option value="low">Low (7%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: Corners (Screenshot 2) ─── */}
            {activeTab === 'corners' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Corner frame</label>
                <div className="corners-style-grid">
                  {CORNER_FRAMES.map(cf => (
                    <button
                      key={cf.id}
                      type="button"
                      className={`corner-option-card-dark ${cornerFrame === cf.id ? 'active' : ''}`}
                      onClick={() => setCornerFrame(cf.id)}
                    >
                      <div className="corner-visual-outer-dark">
                        <div className="corner-visual-inner-dark" />
                      </div>
                      <span className="corner-option-title-dark">{cf.label}</span>
                    </button>
                  ))}
                </div>

                <label className="field-sublabel-dark" style={{ marginTop: '1.5rem' }}>Corner dot</label>
                <div className="corners-style-grid">
                  {CORNER_DOTS.map(cd => (
                    <button
                      key={cd.id}
                      type="button"
                      className={`corner-option-card-dark ${cornerDot === cd.id ? 'active' : ''}`}
                      onClick={() => setCornerDot(cd.id)}
                    >
                      <div className="corner-visual-outer-dark">
                        <div className="corner-dot-visual-dark" />
                      </div>
                      <span className="corner-option-title-dark">{cd.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 3: Colors (Screenshot 3) ─── */}
            {activeTab === 'colors' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Pattern fill</label>
                <div className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    className={`pill-fill-btn-dark ${patternFillType === 'solid' ? 'active' : ''}`}
                    onClick={() => setPatternFillType('solid')}
                  >
                    Solid color
                  </button>
                  <button
                    type="button"
                    className={`pill-fill-btn-dark ${patternFillType === 'gradient' ? 'active' : ''}`}
                    onClick={() => setPatternFillType('gradient')}
                  >
                    Gradient
                  </button>
                </div>

                <label className="field-sublabel-dark">Pattern color</label>
                <div className="color-input-picker-row">
                  <div className="color-swatch-box" style={{ background: patternColor }} />
                  <input
                    type="text"
                    value={patternColor}
                    onChange={e => {
                      setPatternColor(e.target.value)
                      setCornerFrameColor(e.target.value)
                      setCornerDotColor(e.target.value)
                    }}
                    className="edit-input-field-dark color-hex-field"
                  />
                </div>

                <div className="color-swatches-list">
                  {COLOR_SWATCHES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch-circle ${patternColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => {
                        setPatternColor(c)
                        setCornerFrameColor(c)
                        setCornerDotColor(c)
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-4 flex-wrap" style={{ marginTop: '1.5rem' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label className="field-sublabel-dark">Corner frame color</label>
                    <div className="color-input-picker-row">
                      <div className="color-swatch-box" style={{ background: cornerFrameColor }} />
                      <input
                        type="text"
                        value={cornerFrameColor}
                        onChange={e => setCornerFrameColor(e.target.value)}
                        className="edit-input-field-dark color-hex-field"
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label className="field-sublabel-dark">Corner dot color</label>
                    <div className="color-input-picker-row">
                      <div className="color-swatch-box" style={{ background: cornerDotColor }} />
                      <input
                        type="text"
                        value={cornerDotColor}
                        onChange={e => setCornerDotColor(e.target.value)}
                        className="edit-input-field-dark color-hex-field"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label className="field-sublabel-dark">Background</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="color-input-picker-row" style={{ flex: 1, minWidth: 180 }}>
                      <div className="color-swatch-box" style={{ background: transparentBg ? 'transparent' : bgColor, border: '1px solid #cbd5e1' }} />
                      <input
                        type="text"
                        value={transparentBg ? 'Transparent' : bgColor}
                        disabled={transparentBg}
                        onChange={e => setBgColor(e.target.value)}
                        className="edit-input-field-dark color-hex-field"
                      />
                    </div>

                    <label className="switch-toggle-row-dark">
                      <input
                        type="checkbox"
                        checked={transparentBg}
                        onChange={e => setTransparentBg(e.target.checked)}
                      />
                      <span className="slider-switch" />
                      <span>Transparent background</span>
                    </label>
                  </div>
                </div>

                <div className="pattern-contrast-tip-dark">
                  <Info size={14} color="#06b6d4" />
                  <span>Keep the pattern much darker than the background. Light patterns often fail to scan.</span>
                </div>
              </div>
            )}

            {/* ─── TAB 4: Logo (Screenshot 4 - No Logo By Default) ─── */}
            {activeTab === 'logo' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Upload a logo</label>
                <div className="logo-upload-box-dark">
                  <label className="btn-choose-file-dark">
                    <Upload size={14} />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="chosen-file-label-dark">
                    {uploadedLogo ? 'Custom logo chosen' : 'No file chosen'}
                  </span>
                </div>
                <p className="field-helper-desc-dark" style={{ marginTop: '0.4rem', marginBottom: '1.25rem' }}>
                  PNG, JPG, or WebP, under 250 KB. A square logo looks best.
                </p>

                {/* Show center logo toggle */}
                <label className="switch-toggle-row-dark" style={{ marginBottom: '1.25rem' }}>
                  <input
                    type="checkbox"
                    checked={showCenterLogo}
                    onChange={e => setShowCenterLogo(e.target.checked)}
                  />
                  <span className="slider-switch" />
                  <span>Show logo in center of QR code</span>
                </label>

                {showCenterLogo && (
                  <>
                    <label className="field-sublabel-dark">Logo size: {logoSize}px</label>
                    <input
                      type="range"
                      min="20"
                      max="50"
                      value={logoSize}
                      onChange={e => setLogoSize(+e.target.value)}
                      className="range-slider-cyan"
                      style={{ marginBottom: '1.25rem' }}
                    />

                    <label className="switch-toggle-row-dark">
                      <input
                        type="checkbox"
                        checked={whiteSpaceBehindLogo}
                        onChange={e => setWhiteSpaceBehindLogo(e.target.checked)}
                      />
                      <span className="slider-switch" />
                      <span>White space behind the logo</span>
                    </label>
                  </>
                )}

                <div className="pattern-contrast-tip-dark" style={{ marginTop: '1.25rem' }}>
                  <Shield size={14} color="#06b6d4" />
                  <span>With a logo, the code switches to the highest damage resistance automatically.</span>
                </div>
              </div>
            )}

            {/* ─── TAB 5: Frame and CTA (Screenshots 2, 3, 4, 5) ─── */}
            {activeTab === 'frame' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Frame style</label>
                <div className="flex gap-2 flex-wrap" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { id: 'none', label: 'No frame' },
                    { id: 'bottom-banner', label: 'Bottom Banner' },
                    { id: 'top-banner', label: 'Top Banner' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`pill-fill-btn-dark ${ctaFrame === f.id ? 'active' : ''}`}
                      onClick={() => setCtaFrame(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {ctaFrame !== 'none' && (
                  <div style={{ marginTop: '1rem' }}>
                    <label className="field-sublabel-dark">Call to Action (CTA) Text</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={e => setCtaText(e.target.value)}
                      className="edit-input-field-dark"
                      placeholder="Visit our website"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 6: Shape (80 Shapes Grid) ─── */}
            {activeTab === 'shape' && (
              <div className="tab-content-panel">
                <label className="field-sublabel-dark">Shape</label>

                <div className="shapes-8-col-grid">
                  {SHAPES_DATA.map(shape => {
                    const ShapeIcon = shape.icon
                    const isSelected = selectedShape === shape.id
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        className={`shape-item-card-dark ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedShape(shape.id)}
                      >
                        <div className="shape-mini-preview-dark">
                          <ShapeIcon size={22} />
                        </div>
                        <span className="shape-item-title-dark">{shape.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label className="field-sublabel-dark">Outline color</label>
                  <div className="color-input-picker-row">
                    <div className="color-swatch-box" style={{ background: outlineColor }} />
                    <input
                      type="text"
                      value={outlineColor}
                      onChange={e => setOutlineColor(e.target.value)}
                      className="edit-input-field-dark color-hex-field"
                    />
                  </div>
                </div>

                <div className="shape-warning-banner-dark">
                  <Info size={15} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    A shape works with every frame and CTA (Frame and CTA tab). Shaped codes are smaller inside, so test them on two phones before printing.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Name and folder Card */}
          <div className="edit-card-panel-dark">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.25rem' }}>
              Name and folder
            </h3>

            <div className="flex gap-4 flex-wrap">
              <div style={{ flex: 1, minWidth: 220 }}>
                <label className="field-sublabel-dark">Name (only you see this)</label>
                <input
                  type="text"
                  value={qrName}
                  onChange={e => setQrName(e.target.value)}
                  className="edit-input-field-dark"
                  placeholder="Website URL"
                />
              </div>

              <div style={{ width: 200 }}>
                <label className="field-sublabel-dark">Folder</label>
                <select className="edit-select-field-dark">
                  <option value="none">No folder</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Sticky Live Preview & Save (Matches Screenshots 1-5) ─── */}
        <div className="edit-qr-right-column">
          <div className="edit-live-preview-card-dark">
            <div className="live-preview-header">
              <span className="preview-title-dark">Live preview</span>
              <span className="badge-preview-smart">
                <Sparkles size={11} />
                <span>Smart code</span>
              </span>
            </div>

            {/* Checkered Canvas Container */}
            <div className="preview-canvas-box">
              {/* Top Banner CTA (if selected) */}
              {ctaFrame === 'top-banner' && (
                <div
                  className="preview-cta-badge"
                  style={{ background: patternColor, marginBottom: 8 }}
                >
                  {ctaText}
                </div>
              )}

              {/* Dynamic QR Canvas Wrapper with Border padding from slider */}
              <div
                className="preview-qr-dynamic-frame"
                style={{
                  padding: `${whiteBorder * 6}px`,
                  background: transparentBg ? 'transparent' : bgColor,
                  borderRadius: selectedShape === 'circle' ? '50%' : '14px',
                  clipPath: (selectedShape !== 'none' && activeShapeObj.mask !== 'none') ? activeShapeObj.mask : undefined,
                  boxShadow: selectedShape !== 'none' ? `0 0 0 3px ${outlineColor}` : undefined,
                }}
              >
                {/* Real-time Generated Vector QR Code Canvas with instant fallback */}
                <div ref={qrCodeRef} className="qr-render-container">
                  <img
                    src={`${BASE_URL}/api/qr/${qr.id}/image?format=png`}
                    alt="QR Code"
                    style={{
                      width: 240,
                      height: 240,
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>


              {/* Bottom Banner CTA (Matches Screenshots 2, 3, 4, 5) */}
              {ctaFrame === 'bottom-banner' && (
                <div
                  className="preview-cta-badge"
                  style={{ background: patternColor, marginTop: 12 }}
                >
                  {ctaText}
                </div>
              )}
            </div>

            <div className="preview-short-link-line-dark">
              Short link: <span>{qr.redirect_url}</span>
            </div>

            {/* Big Cyan Save Button */}
            <button
              type="button"
              className="btn-save-changes-large"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  <span>Saving changes...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
