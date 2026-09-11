# Project Guidelines, Rules & Design Standards

## 1. Icon Standard (MANDATORY)
- **Source**: Use [Flaticon](https://www.flaticon.com/) or clean SVG vector components from `src/components/common/Icons.jsx`.
- **NO RAW EMOJIS**: Never use raw Unicode emoji icons (e.g. 👁️, 📅, 📱, 📊, ⚡, 🎟️, etc.) in UI buttons, tables, badges, or action elements.
- **Implementation**:
  - Download/create clean SVG vectors adhering to the Flaticon design aesthetic.
  - Store SVG components in `src/components/common/Icons.jsx` or asset files in `src/assets/icons/`.
  - Use vector SVG components with customizable `size`, `color`, and `className` props.

## 2. Design Inspiration, UI Patterns & Micro-Animations (PERMANENT REFERENCE)
Always reference and benchmark UI components, animations, styles, layouts, and cards against these design libraries:
1. **Gym UI & Dashboard Designs**: [Dribbble Gym UI](https://dribbble.com/tags/gym-ui) — modern fitness SaaS dashboards, sleek dark/light mode cards, member roster grids, turnstile analytics.
2. **Visual & Layout Aesthetics**: [Pinterest UI Inspiration](https://in.pinterest.com/) — creative layout structures, fitness app screens, modern gradients, typographic hierarchy.
3. **UI Elements & Micro-Animations**: [Jitter Video UI Templates](https://jitter.video/templates/ui-elements/) — smooth UI transitions, micro-interactions, sleek modal entry animations, state badge pulses, loader effects.

## 3. Aesthetic Execution Standards
- **Premium Look & Feel**: Luxury glassmorphism, subtle borders (`border: 1px solid #e2e8f0` / `rgba(255,255,255,0.08)`), refined shadows (`0 10px 30px rgba(0,0,0,0.05)`), harmonious gradients (`linear-gradient(135deg, ...)`).
- **Responsive & Interactive**: Smooth hover states, micro-transitions (`transition: all 0.2s ease`), animated status pills, and high-fidelity data visualization.
