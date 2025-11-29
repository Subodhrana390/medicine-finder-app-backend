# Contributing to MedicineFinder Backend

Thank you for your interest in contributing to MedicineFinder Backend! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see README.md)
4. **Create a feature branch** for your changes

## 📋 Development Workflow

### 1. Choose an Issue
- Check existing [issues](../../issues) for tasks to work on
- Comment on the issue to indicate you're working on it
- Create a new issue if you have a feature request or bug report

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Follow the existing code structure and conventions
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation if needed

### 4. Test Your Changes
```bash
# Run tests for affected services
npm test

# Test event streaming if modified
npm run test:kafka

# Manual testing with API calls
curl -X GET http://localhost:3000/health
```

### 5. Submit a Pull Request
- Push your changes to your fork
- Create a Pull Request with a clear description
- Reference any related issues
- Wait for review and address feedback

## 🛠️ Code Standards

### General Guidelines
- Use ES6+ features and modern JavaScript practices
- Follow consistent naming conventions
- Write self-documenting code with clear variable names
- Add JSDoc comments for functions and classes

### File Structure
```
services/your-service/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   ├── middlewares/    # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── validators/     # Input validation
│   └── events/         # Kafka event handlers
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

### API Design
- Use RESTful conventions
- Return consistent JSON responses
- Include proper HTTP status codes
- Document endpoints with examples

### Error Handling
- Use async error middleware
- Provide meaningful error messages
- Log errors appropriately
- Don't expose sensitive information

## 🧪 Testing

### Unit Tests
- Write tests for all new functions
- Test error conditions
- Mock external dependencies
- Aim for good test coverage

### Integration Tests
- Test API endpoints
- Test event publishing/consuming
- Test cross-service communication
- Use test databases that don't affect production

### Manual Testing
- Test with various clients (curl, Postman, frontend)
- Test edge cases and error scenarios
- Verify performance and security

## 📚 Documentation

### Code Documentation
- Add JSDoc comments to functions
- Document complex logic
- Explain business rules and assumptions

### API Documentation
- Update API examples in README
- Document new endpoints
- Include request/response examples
- Note authentication requirements

## 🔒 Security Considerations

- Never commit sensitive data (API keys, passwords)
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication/authorization
- Follow OWASP security guidelines

## 🎯 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add Google OAuth login
fix(user): resolve avatar upload issue
docs(api): update endpoint documentation
test(kafka): add event streaming tests
```

## 🚨 Issue Reporting

When reporting bugs or requesting features:

### Bug Reports
- Use a clear, descriptive title
- Include steps to reproduce
- Provide expected vs actual behavior
- Include environment details
- Add screenshots/logs if relevant

### Feature Requests
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider alternative approaches
- Note any related issues

## 📞 Getting Help

- Check existing documentation first
- Search existing issues and discussions
- Ask questions in GitHub discussions
- Reach out to maintainers if needed

## 🙏 Recognition

Contributors will be recognized:
- In the project's contributor list
- In release notes for significant contributions
- Through GitHub's contributor insights

Thank you for contributing to MedicineFinder Backend! 🎉
