from setuptools import setup, find_packages

setup(
    name="swg-cli",
    version="1.0.0",
    description="Snake Water Gun — CLI game with persistent score tracking",
    author="Ansh Sharma",
    python_requires=">=3.8",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "swg=swg.cli:main",
        ]
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
