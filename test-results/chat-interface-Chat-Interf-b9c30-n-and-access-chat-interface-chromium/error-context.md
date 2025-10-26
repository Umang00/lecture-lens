# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Lecture Lens" [level=2] [ref=e5]
      - paragraph [ref=e6]: Sign in to your account
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email address
          - textbox "Email address" [ref=e11]:
            - /placeholder: student@cohort5.com
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]:
            - /placeholder: demo123
      - button "Sign in" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - text: Don't have an account?
        - link "Sign up" [ref=e18] [cursor=pointer]:
          - /url: /signup
    - generic [ref=e19]:
      - paragraph [ref=e20]: "Demo Credentials:"
      - paragraph [ref=e21]: "Student: student@cohort5.com / demo123"
      - paragraph [ref=e22]: "Instructor: instructor@cohort5.com / demo123"
      - paragraph [ref=e23]: "Admin: admin@100x.com / demo123"
  - alert [ref=e24]
```