# PocketView

A modern, lightweight web interface for monitoring system metrics and performance. Built with Next.js and designed to work seamlessly with PocketBase (Beszel) monitoring system, acts as a beautiful frontend.

## Features

- Real-time system monitoring dashboard
- Historical metrics visualization with customizable time ranges
- Multi-system support with individual detail pages
- Responsive design for desktop and mobile devices
- Clean, intuitive user interface
- Automatic data refresh and synchronization

### Monitored Metrics

- CPU usage and load averages
- Memory utilization
- Disk usage and I/O operations
- Network bandwidth (Rx/Tx)
- System uptime and information
- Swap usage

## Quick Installation (One-Click)

```bash
curl -sSL https://github.com/tonyliuzj/pocketview/releases/latest/download/pocketview.sh -o pocketview.sh && chmod +x pocketview.sh && bash pocketview.sh
```

## Manual Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- PocketBase instance with Beszel monitoring data

### Setup

1. Clone the repository:
```bash
git clone https://github.com/tonyliuzj/pocketview.git
cd pocketview
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your PocketBase configuration:
```
NEXT_PUBLIC_POCKETBASE_URL=http://your-pocketbase-url:8090
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

Build the application for production:

```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Backend**: PocketBase for data storage and API
- **Monitoring**: Beszel agent integration

## Project Structure

```
pocketview/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── ui/          # Reusable UI components
│   └── lib/             # Utility functions
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Configuration

### PocketBase Collections

PocketView expects the following PocketBase collections:

- `systems`: System information and current status
- `system_stats`: Historical metrics data

Ensure your PocketBase instance is configured with Beszel monitoring agents reporting to these collections.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/tonyliuzj/pocketview).
