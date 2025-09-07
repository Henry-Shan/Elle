# Elle AI - Startup Legal AI Assistant

Elle AI is a sophisticated legal AI chatbot designed specifically for startups and businesses across multiple industries. Built with Next.js 15 and the Vercel AI SDK, it provides specialized legal guidance with industry-specific models and compliance frameworks.

## 🚀 Features

### Industry-Specific AI Models
Elle AI offers specialized legal models for different industries:

- **General**: Multi-industry compliance with CYA principles
- **Healthcare**: HIPAA-certified compliance, Stark Law, Anti-Kickback Statutes
- **E-commerce**: FTC/UCPD compliance, GDPR/CCPA privacy policies
- **SaaS**: SOC 2/SLAs, cloud contract expertise
- **EdTech**: FERPA/COPPA compliance, educational technology regulations
- **Real Estate**: CRE transactions, REIT/1031 exchanges, SEC compliance
- **Travel & Hospitality**: DOT/EU261 compliance, accessibility regulations
- **Gaming & Esports**: ESIC-certified gaming counsel, NFT/IP licensing

### Core Capabilities

- **Interactive Chat Interface**: Real-time legal consultations with specialized AI models
- **Artifact System**: Create and edit documents, code, images, and spreadsheets
- **Document Management**: Version control, suggestions, and collaborative editing
- **Authentication**: Secure login with Google, GitHub, and email/password
- **Web Search Integration**: Real-time legal research capabilities
- **Multi-modal Input**: Support for text, images, and file attachments

### Artifact Types

1. **Text Artifact**: Draft essays, emails, and legal documents
2. **Code Artifact**: Write and execute Python code
3. **Image Artifact**: Edit, annotate, and process images
4. **Sheet Artifact**: Create and analyze tabular data

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** components
- **ProseMirror** for rich text editing
- **CodeMirror** for code editing

### Backend
- **Next.js API Routes**
- **Vercel AI SDK** for AI integration
- **NextAuth.js** for authentication
- **Drizzle ORM** with PostgreSQL
- **Vercel Blob** for file storage

### AI & ML
- **Multiple AI Providers**: OpenAI, DeepSeek, Fireworks
- **Custom Legal Models**: Industry-specific prompts and guardrails
- **Streaming Responses**: Real-time AI interactions
- **Tool Integration**: Calculator, web search, document creation

### Database
- **PostgreSQL** with Drizzle ORM
- **Database Migrations** with Drizzle Kit
- **Real-time Updates** with SWR

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- PostgreSQL database
- API keys for AI providers (OpenAI, DeepSeek, Fireworks)
- OAuth credentials (Google, GitHub)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Elle
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/elle_ai"

# Authentication
AUTH_SECRET="your-auth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Providers
OPENAI_API_KEY="your-openai-api-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
FIREWORKS_API_KEY="your-fireworks-api-key"

# File Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 4. Database Setup

```bash
# Generate database migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open database studio
pnpm db:studio
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 📚 Available Scripts

```bash
# Development
pnpm dev              # Start development server with Turbo
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint and Biome
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Biome

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:push          # Push schema changes
pnpm db:pull          # Pull schema from database

# Testing
pnpm test             # Run Playwright tests
```

## 🏗️ Project Structure

```
Elle/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Chat interface and API
│   └── (home)/            # Homepage
├── artifacts/             # Artifact system
│   ├── code/              # Code artifact
│   ├── image/             # Image artifact
│   ├── sheet/             # Spreadsheet artifact
│   └── text/              # Text artifact
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── ...                # Feature components
├── lib/                   # Utility libraries
│   ├── ai/                # AI models and tools
│   ├── db/                # Database schema and queries
│   ├── editor/            # Editor configurations
│   └── workflows/         # AI workflows
├── hooks/                 # Custom React hooks
└── docs/                  # Documentation
```

## 🔧 Configuration

### AI Models

Configure AI models in `lib/ai/models.ts`:

```typescript
export const chatModels: Array<ChatModel> = [
  {
    id: "elle-general-base",
    name: "elle-general-base",
    description: "General base model for all industries",
    prompt: `**Role**: Senior Corporate Counsel...`
  },
  // ... more models
];
```

### Authentication

Authentication is configured in `app/(auth)/auth.ts` and `app/(auth)/auth.config.ts`. Supports:
- Email/password authentication
- Google OAuth
- GitHub OAuth

### Database Schema

The database schema is defined in `lib/db/schema.ts` with the following main tables:
- `User`: User accounts and authentication
- `Chat`: Chat conversations
- `Message`: Individual messages in chats
- `Document`: Artifact documents
- `Suggestion`: Document suggestions
- `Vote`: Message voting system

## 🎨 Customization

### Adding New AI Models

1. Add model configuration to `lib/ai/models.ts`
2. Update the model selector component
3. Test with different prompts and guardrails

### Creating Custom Artifacts

1. Create artifact folder in `artifacts/`
2. Implement `client.tsx` and `server.ts`
3. Add to artifact definitions
4. Update database schema

See `docs/03-artifacts.md` for detailed instructions.

### Styling and Theming

- Uses Tailwind CSS for styling
- Dark/light theme support with `next-themes`
- Customizable color schemes in `tailwind.config.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

## 📖 Documentation

- [Quick Start Guide](docs/01-quick-start.md)
- [Updating AI Models](docs/02-update-models.md)
- [Artifacts System](docs/03-artifacts.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the code examples in the `artifacts/` directory

## 🔮 Roadmap

- [ ] Additional industry-specific models
- [ ] Enhanced document collaboration features
- [ ] Integration with legal databases
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Advanced compliance monitoring

---

**Elle AI** - Empowering startups with intelligent legal guidance across all industries.
